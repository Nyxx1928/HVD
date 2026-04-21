# Docker Setup

This project includes Docker configuration for easy deployment and development.

> **For Production Deployment:** See [backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md) for comprehensive production deployment instructions including SSL/TLS setup, monitoring, backups, and security best practices.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Development with Docker Compose

1. Start all services:
```bash
docker compose up -d
```

2. View logs:
```bash
docker compose logs -f
```

3. Stop all services:
```bash
docker compose down
```

4. Stop and remove volumes:
```bash
docker compose down -v
```

## Services

The Docker Compose setup includes:

- **PostgreSQL** (port 5432): Database server
- **Backend** (port 3001): NestJS API server
- **Frontend** (port 3000): Next.js web application

## Building Individual Images

### Backend
```bash
docker build -f backend/Dockerfile -t valentines/backend:latest backend
```

### Frontend
```bash
docker build -f valentines/Dockerfile -t valentines/frontend:latest valentines
```

## Running Individual Containers

### Backend
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/valentines \
  valentines/backend:latest
```

### Frontend
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001 \
  valentines/frontend:latest
```

## Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3001)

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Troubleshooting

### Database Connection Issues
If the backend can't connect to the database, ensure:
1. PostgreSQL container is running and healthy
2. Database credentials are correct
3. Network connectivity between containers

### Port Conflicts
If ports are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3002:3001"  # Change host port
```

### Rebuilding After Code Changes
```bash
docker compose up -d --build
```

## Production Considerations

For production deployment:
1. Use environment-specific `.env` files
2. Set up proper secrets management
3. Configure reverse proxy (nginx/traefik)
4. Set up SSL/TLS certificates
5. Configure database backups
6. Set resource limits in docker-compose.yml

**For detailed production deployment instructions, see [backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md)**

This comprehensive guide covers:
- Step-by-step Docker deployment to production servers
- SSL/TLS setup with Nginx or Traefik
- Environment variable configuration and security
- Health checks and monitoring setup (Prometheus, Grafana, uptime monitoring)
- Automated backup and restore procedures
- Security best practices and hardening
- Troubleshooting common deployment issues
