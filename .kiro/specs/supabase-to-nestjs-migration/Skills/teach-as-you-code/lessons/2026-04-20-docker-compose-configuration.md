# Lesson: Docker Compose Configuration for Multi-Service Application

## Task Context

- **Goal**: Create a production-ready docker-compose.yml that orchestrates the PostgreSQL database and NestJS backend services together
- **Scope**: Configure services, environment variables, health checks, restart policies, and persistent volumes
- **Constraints**: Must support both development and production environments through environment variables

## Step-by-Step Changes

1. **Updated postgres service configuration**
   - Changed hardcoded environment variables to use `${VAR:-default}` syntax
   - This allows overriding values via `.env` file or shell environment
   - Added `restart: unless-stopped` policy for automatic recovery

2. **Enhanced backend service configuration**
   - Added `CORS_ORIGIN` environment variable for cross-origin request configuration
   - Added `NODE_ENV` environment variable to distinguish dev/prod environments
   - Made PORT configurable through environment variables
   - Added `restart: unless-stopped` policy
   - Removed hardcoded `command` override (now handled in Dockerfile CMD)

3. **Improved frontend service configuration**
   - Made API URL configurable through environment variables
   - Made frontend port configurable
   - Added `restart: unless-stopped` policy

4. **Maintained critical features**
   - Health check for postgres using `pg_isready` command
   - Persistent volume for database data (`postgres_data`)
   - Service dependency chain: frontend → backend → postgres
   - Health check condition on postgres before backend starts

## Why This Approach

**Environment Variable Flexibility**: Using `${VAR:-default}` syntax provides:
- Default values for quick local development
- Easy override for production deployments
- No need to modify docker-compose.yml for different environments

**Restart Policy**: `unless-stopped` ensures:
- Services automatically restart after crashes
- Services stay stopped if manually stopped (won't restart on reboot)
- Better than `always` for development where you might want to stop services

**Health Check Dependencies**: The `condition: service_healthy` ensures:
- Backend only starts after database is ready
- Prevents connection errors during startup
- Automatic retry if database takes time to initialize

**Persistent Volumes**: Named volume `postgres_data` ensures:
- Database data survives container restarts
- Data persists even if containers are removed
- Easy backup and migration strategies

## Alternatives Considered

**Option 1: Hardcoded values**
- Simpler but requires editing docker-compose.yml for each environment
- Not suitable for production deployments
- Security risk (passwords in version control)

**Option 2: Multiple docker-compose files**
- `docker-compose.yml` for base config
- `docker-compose.override.yml` for development
- `docker-compose.prod.yml` for production
- More complex but better separation of concerns
- Good for larger projects with very different environments

**Option 3: External .env file only**
- Requires .env file to exist (no defaults)
- Fails if .env is missing
- Less convenient for quick starts

**Our choice**: Environment variables with defaults provide the best balance of flexibility and ease of use.

## Key Concepts

### Docker Compose Service Dependencies

```yaml
depends_on:
  postgres:
    condition: service_healthy
```

This creates a startup order:
1. Postgres starts first
2. Docker waits for health check to pass
3. Backend starts only after postgres is healthy
4. Frontend starts after backend is up

### Environment Variable Syntax

```yaml
${VARIABLE_NAME:-default_value}
```

- `VARIABLE_NAME`: Looks for this in environment or .env file
- `:-`: Separator between variable and default
- `default_value`: Used if VARIABLE_NAME is not set

### Health Checks

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

- **test**: Command to check if service is healthy
- **interval**: How often to run the check
- **timeout**: How long to wait for check to complete
- **retries**: How many failures before marking unhealthy

### Restart Policies

- `no`: Never restart (default)
- `always`: Always restart, even after manual stop
- `on-failure`: Only restart on error exit codes
- `unless-stopped`: Always restart unless manually stopped

### Named Volumes

```yaml
volumes:
  postgres_data:
```

Creates a Docker-managed volume that:
- Persists data outside container lifecycle
- Can be backed up with `docker volume` commands
- Shared across container recreations
- Located in Docker's volume directory

## Potential Pitfalls

### 1. Missing .env file in production
**Problem**: If you rely on defaults in production, you might use weak passwords.
**Solution**: Always create a `.env` file in production with strong credentials.

### 2. Port conflicts
**Problem**: If ports 3000, 3001, or 5432 are already in use, services won't start.
**Solution**: Override ports in .env file:
```bash
BACKEND_PORT=3002
FRONTEND_PORT=3001
```

### 3. Volume permissions
**Problem**: PostgreSQL container might fail if volume has wrong permissions.
**Solution**: Docker handles this automatically for named volumes, but be careful with bind mounts.

### 4. Database connection string format
**Problem**: Wrong DATABASE_URL format causes connection failures.
**Solution**: Use PostgreSQL format: `postgresql://user:password@host:port/database`
Note: Not `postgres://` (though it often works, `postgresql://` is the official format)

### 5. Health check timing
**Problem**: Backend might start before database is truly ready.
**Solution**: The health check with retries handles this, but you can adjust interval/retries if needed.

### 6. CORS configuration
**Problem**: Frontend can't connect if CORS_ORIGIN doesn't match frontend URL.
**Solution**: Set CORS_ORIGIN to match your frontend domain in production:
```bash
CORS_ORIGIN=https://yourdomain.com
```

### 7. Restart loops
**Problem**: If backend has a startup error, `unless-stopped` will keep restarting it.
**Solution**: Check logs with `docker-compose logs backend` to diagnose issues.

## What You Learned

### Docker Compose Orchestration
You learned how to coordinate multiple services (database, backend, frontend) with proper startup ordering and health checks. This is essential for microservices architecture.

### Environment-Based Configuration
You learned the `${VAR:-default}` pattern for flexible configuration that works in both development and production without code changes.

### Production Readiness
You learned key production concerns:
- Restart policies for reliability
- Health checks for proper startup
- Persistent volumes for data safety
- Configurable CORS for security

### Service Dependencies
You learned how to express dependencies between services and wait for health checks before starting dependent services.

### Docker Networking
You learned that Docker Compose automatically creates a network where services can reference each other by name (e.g., `postgres:5432` in DATABASE_URL).

This configuration provides a solid foundation for deploying your application anywhere Docker runs - from your local machine to cloud providers like AWS, DigitalOcean, or your own VPS.
