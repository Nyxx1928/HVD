# Production Deployment Guide

This guide provides comprehensive instructions for deploying the Valentine's Love Wall NestJS backend to a production environment using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [SSL/TLS Setup](#ssltls-setup)
- [Health Checks and Monitoring](#health-checks-and-monitoring)
- [Backup and Restore](#backup-and-restore)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to production, ensure you have:

- **Server Requirements:**
  - Linux server (Ubuntu 22.04 LTS recommended)
  - Minimum 2GB RAM, 2 CPU cores
  - 20GB+ available disk space
  - Root or sudo access

- **Software Requirements:**
  - Docker Engine 24.0+
  - Docker Compose 2.20+
  - Git (for cloning repository)

- **Network Requirements:**
  - Open ports: 80 (HTTP), 443 (HTTPS), 3001 (API)
  - Domain name (optional but recommended)
  - SSL/TLS certificate (Let's Encrypt recommended)

## Docker Deployment

### Step 1: Prepare the Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Clone the Repository

```bash
# Clone your repository
git clone <your-repository-url>
cd <repository-name>

# Or if deploying from a specific branch/tag
git clone -b production <your-repository-url>
cd <repository-name>
```

### Step 3: Configure Environment Variables

Create a production `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit with production values
nano .env
```

**Required Production Configuration:**

```bash
# Database Configuration
POSTGRES_DB=valentines_prod
POSTGRES_USER=valentines_user
POSTGRES_PASSWORD=<STRONG_RANDOM_PASSWORD>

# Backend Configuration
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
BACKEND_PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Frontend Configuration (if deploying frontend)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
FRONTEND_PORT=3000
```

**Generate a strong password:**
```bash
# Generate a 32-character random password
openssl rand -base64 32
```

### Step 4: Build and Start Services

```bash
# Build and start all services in detached mode
docker compose up -d --build

# View logs to verify startup
docker compose logs -f

# Check service status
docker compose ps
```

Expected output:
```
NAME                    STATUS              PORTS
valentines-postgres     Up (healthy)        0.0.0.0:5432->5432/tcp
valentines-backend      Up                  0.0.0.0:3001->3001/tcp
valentines-frontend     Up                  0.0.0.0:3000->3000/tcp
```

### Step 5: Verify Deployment

```bash
# Test health endpoint
curl http://localhost:3001

# Expected response:
# {"message":"Valentine's Love Wall API is running!"}

# Test database connectivity
curl http://localhost:3001/health

# Test API endpoints
curl http://localhost:3001/love-notes
```

### Step 6: Run Database Migrations

Migrations are automatically run when the backend container starts (via the Dockerfile CMD). To manually run migrations:

```bash
# Run migrations manually if needed
docker compose exec backend npx prisma migrate deploy

# Verify migration status
docker compose exec backend npx prisma migrate status
```

## Environment Variables

### Production Environment Configuration

Create a `backend/.env` file with the following variables:

#### Database Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@postgres:5432/db` | Yes |
| `POSTGRES_DB` | Database name | `valentines_prod` | Yes |
| `POSTGRES_USER` | Database user | `valentines_user` | Yes |
| `POSTGRES_PASSWORD` | Database password | `<strong-random-password>` | Yes |

#### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | `3001` | No |
| `NODE_ENV` | Environment mode | `production` | Yes |
| `BACKEND_PORT` | Docker host port mapping | `3001` | No |

#### CORS Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGIN` | Allowed frontend origin | `https://yourdomain.com` | Yes |

**Important:** Set `CORS_ORIGIN` to your actual frontend domain. For multiple origins, modify the backend code to accept an array.

#### Rate Limiting Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_NOTES_MAX` | Max love note requests per IP per window | `5` | No |
| `RATE_LIMIT_NOTES_WINDOW_MS` | Rate limit window for notes (ms) | `60000` | No |
| `RATE_LIMIT_COMMENTS_MAX` | Max comment requests per IP per window | `10` | No |
| `RATE_LIMIT_COMMENTS_WINDOW_MS` | Rate limit window for comments (ms) | `60000` | No |

### Environment Variable Security

**Best Practices:**

1. **Never commit `.env` files to version control**
   ```bash
   # Ensure .env is in .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use strong passwords**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32
   ```

3. **Restrict file permissions**
   ```bash
   chmod 600 .env
   ```

4. **Use secrets management for sensitive data**
   - Consider using Docker secrets
   - Use environment-specific secret managers (AWS Secrets Manager, HashiCorp Vault)

5. **Rotate credentials regularly**
   - Change database passwords periodically
   - Update API keys and tokens

## SSL/TLS Setup

### Option 1: Using Nginx Reverse Proxy with Let's Encrypt

This is the recommended approach for production deployments.

#### Step 1: Install Nginx

```bash
sudo apt install nginx -y
```

#### Step 2: Configure Nginx

Create a configuration file for your domain:

```bash
sudo nano /etc/nginx/sites-available/valentines-api
```

Add the following configuration:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Proxy to Backend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

#### Step 3: Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/valentines-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 4: Install Certbot and Obtain SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

#### Step 5: Auto-Renewal

Certbot automatically sets up a cron job for renewal. Verify it:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

### Option 2: Using Traefik Reverse Proxy

Traefik is a modern reverse proxy that integrates well with Docker.

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=3001"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      PORT: 3001
      CORS_ORIGIN: https://yourdomain.com
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy with:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### SSL/TLS Best Practices

1. **Use TLS 1.2 or higher** - Disable older protocols
2. **Strong cipher suites** - Use modern, secure ciphers
3. **HSTS headers** - Force HTTPS connections
4. **Certificate monitoring** - Set up alerts for expiring certificates
5. **Regular updates** - Keep Nginx/Traefik updated

## Health Checks and Monitoring

### Built-in Health Check Endpoints

The backend provides health check endpoints for monitoring:

#### Root Endpoint
```bash
curl http://localhost:3001/

# Response:
{
  "message": "Valentine's Love Wall API is running!"
}
```

#### Health Check Endpoint
```bash
curl http://localhost:3001/health

# Response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

### Docker Health Checks

The `docker-compose.yml` includes health checks for PostgreSQL:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Add a health check for the backend by updating `docker-compose.yml`:

```yaml
backend:
  # ... other configuration
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### Monitoring Setup

#### Option 1: Simple Uptime Monitoring

Use a service like:
- **UptimeRobot** (free tier available)
- **Pingdom**
- **StatusCake**

Configure to monitor:
- `https://api.yourdomain.com/health` every 5 minutes
- Alert on 3 consecutive failures

#### Option 2: Prometheus + Grafana

For comprehensive monitoring, set up Prometheus and Grafana:

**Add to `docker-compose.yml`:**

```yaml
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=<strong-password>
    ports:
      - "3002:3000"
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

**Create `prometheus.yml`:**

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
```

#### Option 3: Application Logging

Configure centralized logging:

**Using Docker logging driver:**

```yaml
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

**View logs:**
```bash
# View real-time logs
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail=100 backend

# Export logs
docker compose logs backend > backend-logs.txt
```

### Monitoring Checklist

- [ ] Health check endpoint responding
- [ ] Database connectivity verified
- [ ] API endpoints responding correctly
- [ ] Rate limiting functioning
- [ ] SSL certificate valid and not expiring soon
- [ ] Disk space sufficient (>20% free)
- [ ] Memory usage normal (<80%)
- [ ] CPU usage normal (<80%)
- [ ] No error spikes in logs

## Backup and Restore

### Database Backup Procedures

#### Manual Backup

```bash
# Create backup directory
mkdir -p ./backups

# Backup database
docker compose exec -T postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > ./backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh ./backups/
```

#### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/path/to/backups"
RETENTION_DAYS=30
POSTGRES_USER="valentines_user"
POSTGRES_DB="valentines_prod"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"

# Create backup
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Remove old backups
find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Make it executable:
```bash
chmod +x backup.sh
```

#### Schedule Automated Backups

Add to crontab:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/valentines-backup.log 2>&1
```

### Database Restore Procedures

#### Restore from Backup

```bash
# Stop the backend to prevent connections
docker compose stop backend

# Restore database
docker compose exec -T postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB} < ./backups/backup-20240115-020000.sql

# Or restore from compressed backup
gunzip -c ./backups/backup-20240115-020000.sql.gz | docker compose exec -T postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB}

# Restart backend
docker compose start backend
```

#### Restore to a New Database

```bash
# Create new database
docker compose exec postgres createdb -U ${POSTGRES_USER} valentines_restored

# Restore to new database
docker compose exec -T postgres psql -U ${POSTGRES_USER} valentines_restored < ./backups/backup-20240115-020000.sql

# Update DATABASE_URL in .env to point to new database
# Restart services
docker compose restart backend
```

### Backup Best Practices

1. **Regular backups** - Daily at minimum, hourly for critical data
2. **Test restores** - Regularly verify backups can be restored
3. **Off-site storage** - Store backups in a different location
4. **Encryption** - Encrypt backups containing sensitive data
5. **Retention policy** - Keep 30 days of daily backups, 12 months of monthly backups
6. **Monitoring** - Alert on backup failures

### Backup to Cloud Storage

#### AWS S3 Example

```bash
#!/bin/bash

# Install AWS CLI if not already installed
# sudo apt install awscli -y

# Configuration
BACKUP_DIR="/tmp/backups"
S3_BUCKET="s3://your-bucket/valentines-backups"
POSTGRES_USER="valentines_user"
POSTGRES_DB="valentines_prod"

# Create backup
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

# Upload to S3
aws s3 cp "${BACKUP_FILE}.gz" "$S3_BUCKET/"

# Cleanup local backup
rm "${BACKUP_FILE}.gz"

echo "Backup uploaded to S3"
```

## Security Best Practices

### 1. Environment Security

```bash
# Secure .env file permissions
chmod 600 .env

# Never commit .env to version control
echo ".env" >> .gitignore

# Use strong passwords
openssl rand -base64 32
```

### 2. Database Security

```yaml
# In docker-compose.yml, don't expose PostgreSQL port publicly
postgres:
  # Remove or comment out:
  # ports:
  #   - "5432:5432"
  
  # Only backend needs access via Docker network
```

### 3. Firewall Configuration

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install ufw -y

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend port only from localhost (if needed)
sudo ufw allow from 127.0.0.1 to any port 3001

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 4. Docker Security

```bash
# Run Docker daemon with user namespace remapping
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "userns-remap": "default"
}
```

```bash
# Restart Docker
sudo systemctl restart docker
```

### 5. Rate Limiting

The application includes built-in rate limiting:
- 5 requests per 60 seconds for creating love notes
- 10 requests per 60 seconds for creating comments

Adjust in `.env` if needed:
```bash
RATE_LIMIT_NOTES_MAX=5
RATE_LIMIT_NOTES_WINDOW_MS=60000
```

### 6. CORS Configuration

Restrict CORS to your frontend domain only:

```bash
# In .env
CORS_ORIGIN=https://yourdomain.com
```

For multiple domains, modify `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true,
});
```

### 7. Security Headers

Ensure Nginx adds security headers (see SSL/TLS Setup section).

### 8. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d --build

# Update Node.js dependencies
cd backend
npm audit fix
npm update
```

### 9. Secrets Management

For production, consider using:
- **Docker Secrets** (Docker Swarm)
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**

### 10. Security Checklist

- [ ] Strong passwords for all services
- [ ] `.env` file permissions set to 600
- [ ] Database not exposed publicly
- [ ] Firewall configured and enabled
- [ ] SSL/TLS certificates installed and valid
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular backups scheduled
- [ ] Monitoring and alerting set up
- [ ] System and dependencies updated
- [ ] Logs reviewed regularly

## Troubleshooting

### Common Issues

#### 1. Backend Can't Connect to Database

**Symptoms:**
```
Error: Can't reach database server at `postgres:5432`
```

**Solutions:**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Ensure backend depends on postgres health check
# In docker-compose.yml:
depends_on:
  postgres:
    condition: service_healthy
```

#### 2. Port Already in Use

**Symptoms:**
```
Error: bind: address already in use
```

**Solutions:**
```bash
# Find process using the port
sudo lsof -i :3001

# Kill the process
sudo kill -9 <PID>

# Or change the port in .env
BACKEND_PORT=3002
```

#### 3. CORS Errors

**Symptoms:**
```
Access to fetch at 'http://api.yourdomain.com' from origin 'https://yourdomain.com' 
has been blocked by CORS policy
```

**Solutions:**
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=https://yourdomain.com

# Restart backend
docker compose restart backend

# Check backend logs
docker compose logs backend | grep CORS
```

#### 4. SSL Certificate Issues

**Symptoms:**
```
SSL certificate problem: certificate has expired
```

**Solutions:**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates
```

#### 5. Database Migration Failures

**Symptoms:**
```
Error: Migration failed to apply
```

**Solutions:**
```bash
# Check migration status
docker compose exec backend npx prisma migrate status

# Resolve failed migration
docker compose exec backend npx prisma migrate resolve --rolled-back <migration-name>

# Apply migrations
docker compose exec backend npx prisma migrate deploy
```

#### 6. Out of Disk Space

**Symptoms:**
```
Error: ENOSPC: no space left on device
```

**Solutions:**
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old logs
sudo journalctl --vacuum-time=7d

# Check large files
du -sh /* | sort -h
```

#### 7. High Memory Usage

**Symptoms:**
- Slow response times
- Container restarts

**Solutions:**
```bash
# Check memory usage
docker stats

# Limit container memory in docker-compose.yml:
backend:
  deploy:
    resources:
      limits:
        memory: 512M

# Restart services
docker compose restart
```

### Debugging Commands

```bash
# View all container logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs postgres

# Follow logs in real-time
docker compose logs -f backend

# Check container status
docker compose ps

# Inspect container
docker inspect valentines-backend

# Execute commands in container
docker compose exec backend sh

# Check environment variables
docker compose exec backend env

# Test database connection
docker compose exec backend npx prisma db pull

# Check API health
curl http://localhost:3001/health

# Test database directly
docker compose exec postgres psql -U valentines_user -d valentines_prod -c "SELECT COUNT(*) FROM love_notes;"
```

### Getting Help

If you encounter issues not covered here:

1. **Check logs** - Most issues are logged
2. **Review documentation** - README.md, API.md, DOCKER.md
3. **Search issues** - Check GitHub issues for similar problems
4. **Ask for help** - Open a new GitHub issue with:
   - Error messages
   - Relevant logs
   - Steps to reproduce
   - Environment details

## Next Steps

After successful deployment:

1. **Monitor the application** - Set up monitoring and alerts
2. **Test thoroughly** - Verify all endpoints work correctly
3. **Configure backups** - Set up automated database backups
4. **Document your setup** - Keep notes on your specific configuration
5. **Plan for scaling** - Consider load balancing and horizontal scaling
6. **Set up CI/CD** - Automate deployments with GitHub Actions or similar

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Need Help?** Open an issue on GitHub or consult the [Troubleshooting](#troubleshooting) section.
