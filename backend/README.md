# Valentine's Love Wall - NestJS Backend

A self-hosted NestJS backend API for the Valentine's Love Wall application, replacing Supabase with PostgreSQL and Prisma ORM. This backend provides REST API endpoints for creating and viewing love notes and comments, with built-in rate limiting and validation.

## Project Overview

This backend is part of a full-stack Valentine's Love Wall application where users can:
- Post love notes with custom emojis and colors
- Add comments to existing love notes
- View all notes and comments in real-time

The backend handles all data persistence, validation, and rate limiting to prevent abuse.

## Technology Stack

- **Framework**: NestJS 10.x - Progressive Node.js framework for building efficient server-side applications
- **Database**: PostgreSQL 16.x - Powerful open-source relational database
- **ORM**: Prisma 5.x - Next-generation TypeScript ORM with type safety
- **Validation**: class-validator & class-transformer - Decorator-based validation
- **Language**: TypeScript - Strongly typed JavaScript
- **Testing**: Jest - JavaScript testing framework
- **Containerization**: Docker & Docker Compose - For consistent development and deployment

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **Docker and Docker Compose** - [Download here](https://www.docker.com/products/docker-desktop/)
- **PostgreSQL 16+** (optional if using Docker)
- **npm** or **yarn** package manager

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Frontend URL (default: http://localhost:3000)

### 3. Start PostgreSQL

Using Docker Compose (recommended):

```bash
docker-compose up postgres -d
```

Or use your own PostgreSQL instance and update `DATABASE_URL` in `.env`.

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Start the Backend

Development mode with hot reload:

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001`.

## Testing

### Running Tests

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Run tests with coverage report
npm run test:cov

# Debug tests
npm run test:debug
```

### Test Structure

- **Unit Tests**: Located alongside source files with `.spec.ts` extension
- **E2E Tests**: Located in `test/` directory
- **Coverage Reports**: Generated in `coverage/` directory

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode with hot reload |
| `npm run start:debug` | Start in debug mode with watch |
| `npm run start:prod` | Start in production mode |
| `npm run build` | Build the application for production |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage report |
| `npm run lint` | Lint and fix code issues |
| `npm run format` | Format code with Prettier |
| `npm run migrate:from-supabase` | Migrate data from Supabase to PostgreSQL |

## Project Structure

```
backend/
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root module
│   ├── app.controller.ts                # Root controller
│   ├── app.service.ts                   # Root service
│   ├── prisma/                          # Prisma ORM module
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── love-notes/                      # Love notes feature module
│   │   ├── love-notes.module.ts
│   │   ├── love-notes.controller.ts
│   │   ├── love-notes.service.ts
│   │   └── dto/                         # Data transfer objects
│   │       ├── create-love-note.dto.ts
│   │       └── love-note-response.dto.ts
│   ├── comments/                        # Comments feature module
│   │   ├── comments.module.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   └── dto/
│   │       ├── create-comment.dto.ts
│   │       └── comment-response.dto.ts
│   ├── rate-limit/                      # Rate limiting module
│   │   ├── rate-limit.module.ts
│   │   ├── rate-limit.service.ts
│   │   └── rate-limit.guard.ts
│   ├── health/                          # Health check module
│   │   ├── health.module.ts
│   │   └── health.controller.ts
│   └── common/                          # Shared utilities
│       ├── filters/
│       │   └── http-exception.filter.ts
│       └── interceptors/
│           └── logging.interceptor.ts
├── prisma/                              # Database schema and migrations
│   ├── schema.prisma                    # Prisma schema definition
│   └── migrations/                      # Database migration files
├── test/                                # End-to-end tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── scripts/                             # Utility scripts
│   └── migrate-from-supabase.ts         # Data migration script
├── .env.example                         # Environment variables template
├── .env                                 # Local environment variables (gitignored)
├── Dockerfile                           # Docker container definition
├── docker-compose.yml                   # Docker Compose configuration
├── nest-cli.json                        # NestJS CLI configuration
├── tsconfig.json                        # TypeScript configuration
└── package.json                         # Dependencies and scripts
```

## API Documentation

For comprehensive API documentation including all endpoints, request/response examples, validation rules, error codes, and rate limiting information, see:

**[API.md](./API.md)** - Complete API Reference

### Quick Reference

The API provides the following endpoints:

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/` | GET | Root endpoint - API status | None |
| `/health` | GET | Health check and database status | None |
| `/love-notes` | GET | Retrieve all love notes | None |
| `/love-notes` | POST | Create a new love note | 5 req/60s per IP |
| `/love-notes/:id/comments` | GET | Get comments for a note | None |
| `/love-notes/:id/comments` | POST | Add a comment to a note | 10 req/60s per IP |

For detailed information about request/response formats, validation rules, error handling, and examples, please refer to the [API.md](./API.md) documentation.

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Database Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/lovewall` | Yes |

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3001` | No |
| `NODE_ENV` | Environment mode | `development` | No |

### CORS Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGIN` | Allowed CORS origin (frontend URL) | `http://localhost:3000` | No |

### Rate Limiting Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_NOTES_MAX` | Max love note requests per IP per window | `5` | No |
| `RATE_LIMIT_NOTES_WINDOW_MS` | Rate limit window for notes (milliseconds) | `60000` | No |
| `RATE_LIMIT_COMMENTS_MAX` | Max comment requests per IP per window | `10` | No |
| `RATE_LIMIT_COMMENTS_WINDOW_MS` | Rate limit window for comments (milliseconds) | `60000` | No |

### Migration Configuration (Optional)

Only needed when migrating data from Supabase:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` | For migration only |
| `SUPABASE_KEY` | Your Supabase service role key | `eyJhbGc...` | For migration only |

### Example .env File

```bash
# Database
DATABASE_URL="postgresql://lovewall:password@localhost:5432/lovewall"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_NOTES_MAX=5
RATE_LIMIT_NOTES_WINDOW_MS=60000
RATE_LIMIT_COMMENTS_MAX=10
RATE_LIMIT_COMMENTS_WINDOW_MS=60000
```

## Database Migrations

This project uses Prisma for database schema management and migrations.

### Running Migrations

**Development Environment:**
```bash
# Create and apply a new migration
npx prisma migrate dev

# Create a new migration with a custom name
npx prisma migrate dev --name add_new_feature

# Reset the database (WARNING: deletes all data)
npx prisma migrate reset
```

**Production Environment:**
```bash
# Apply pending migrations
npx prisma migrate deploy
```

### Viewing Database

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit database records.

### Common Migration Commands

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev` | Create and apply migrations in development |
| `npx prisma migrate deploy` | Apply migrations in production |
| `npx prisma migrate reset` | Reset database and apply all migrations |
| `npx prisma migrate status` | Check migration status |
| `npx prisma studio` | Open visual database browser |
| `npx prisma generate` | Generate Prisma Client after schema changes |

### Database Schema

The database consists of three main tables:

**love_notes**
- `id` (UUID, Primary Key)
- `name` (VARCHAR(36))
- `message` (VARCHAR(240))
- `emoji` (VARCHAR(10), default: 💗)
- `color` (VARCHAR(20), default: rose)
- `created_at` (TIMESTAMPTZ)

**comments**
- `id` (UUID, Primary Key)
- `note_id` (UUID, Foreign Key → love_notes.id)
- `name` (VARCHAR(36))
- `comment` (VARCHAR(200))
- `created_at` (TIMESTAMPTZ)

**rate_limits**
- `id` (UUID, Primary Key)
- `ip` (VARCHAR(45), Unique)
- `count` (INTEGER)
- `reset_at` (TIMESTAMPTZ)

## Migrating Data from Supabase

If you're migrating from an existing Supabase instance, you can use the migration script to transfer all your love notes and comments to the new PostgreSQL database.

### Prerequisites

- Your Supabase project URL and service role key
- PostgreSQL database running and accessible via `DATABASE_URL`
- Empty PostgreSQL database (or the script will validate existing data)

### Migration Steps

1. **Set up environment variables:**

   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_KEY="your-service-role-key"
   export DATABASE_URL="postgresql://user:password@localhost:5432/lovewall"
   ```

   Or on Windows (PowerShell):

   ```powershell
   $env:SUPABASE_URL="https://your-project.supabase.co"
   $env:SUPABASE_KEY="your-service-role-key"
   $env:DATABASE_URL="postgresql://user:password@localhost:5432/lovewall"
   ```

2. **Run the migration:**

   ```bash
   npm run migrate:from-supabase
   ```

### What the Migration Does

The migration script will:

1. **Export** all love notes from the `love_wall` table in Supabase
2. **Export** all comments from the `love_wall_comments` table in Supabase
3. **Save backups** to `./migration-backups/` directory as JSON files
4. **Import** all data into PostgreSQL preserving IDs, timestamps, and relationships
5. **Validate** the migration by:
   - Comparing record counts between Supabase and PostgreSQL
   - Verifying a random sample of records match exactly
   - Checking all foreign key relationships are intact

### Migration Output

The script provides detailed progress information:

```
🚀 Starting migration from Supabase to PostgreSQL...

🔍 Checking if migration already completed...
   ✓ Database is empty, proceeding with migration

📤 Exporting data from Supabase...
   ✓ Exported 42 love notes
   ✓ Exported 128 comments

💾 Saving backup files...
   ✓ Saved love-notes-2024-01-15T10-30-00-000Z.json
   ✓ Saved comments-2024-01-15T10-30-00-000Z.json

📥 Importing data to PostgreSQL...
   ✓ Imported 42 love notes
   ✓ Imported 128 comments

✅ Validating migration...
   ✓ All validations passed!

🎉 Migration completed!
```

### Idempotency

The migration script is **idempotent** - you can safely run it multiple times:

- If the database is empty, it performs the full migration
- If data already exists, it validates the existing data against Supabase
- It will never duplicate data

### Troubleshooting

**Missing environment variables:**
```
❌ Error: Missing required environment variables
Please set SUPABASE_URL and SUPABASE_KEY
```
Solution: Ensure both `SUPABASE_URL` and `SUPABASE_KEY` are set.

**Database connection error:**
```
❌ Migration failed: Can't reach database server
```
Solution: Verify `DATABASE_URL` is correct and PostgreSQL is running.

**Validation failures:**
If validation fails, the script will show detailed information about mismatches. Check the backup files in `./migration-backups/` for the exported data.

## Troubleshooting

### Common Issues

**Database Connection Error**
```
Error: Can't reach database server at `localhost:5432`
```
**Solution**: Ensure PostgreSQL is running. If using Docker:
```bash
docker-compose up postgres -d
docker-compose ps  # Check if postgres is running
```

**Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution**: Either stop the process using port 3001 or change the `PORT` in your `.env` file.

**Prisma Client Not Generated**
```
Error: Cannot find module '@prisma/client'
```
**Solution**: Generate the Prisma Client:
```bash
npx prisma generate
```

**Migration Fails**
```
Error: Migration failed to apply
```
**Solution**: Check your database connection and ensure no other migrations are running:
```bash
npx prisma migrate status
npx prisma migrate resolve --rolled-back <migration-name>
```

**Rate Limit Not Working**
**Solution**: Ensure the `rate_limits` table exists and rate limit environment variables are set correctly. Check logs for errors.

### Debugging Tips

**Enable Debug Logging:**
```bash
# Set environment variable
DEBUG=* npm run start:dev
```

**Check Database Connection:**
```bash
npx prisma db pull  # Test connection and pull schema
```

**View Application Logs:**
The application logs all HTTP requests, errors, and rate limit violations. Check the console output for detailed information.

**Test API Endpoints:**
Use tools like [Postman](https://www.postman.com/), [Insomnia](https://insomnia.rest/), or curl:
```bash
# Test health endpoint
curl http://localhost:3001

# Test GET love notes
curl http://localhost:3001/love-notes

# Test POST love note
curl -X POST http://localhost:3001/love-notes \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","message":"Hello World"}'
```

## Development Workflow

### Making Changes

1. **Modify Database Schema:**
   - Edit `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name description`
   - Prisma generates migration SQL and updates client

2. **Add New Endpoints:**
   - Create/update DTO in module's `dto/` folder
   - Add method to service
   - Add route to controller
   - Write tests
   - Update API documentation in this README

3. **Run Tests:**
   ```bash
   npm run test          # Unit tests
   npm run test:e2e      # Integration tests
   npm run test:cov      # Coverage report
   ```

4. **Code Quality:**
   ```bash
   npm run lint          # Check for issues
   npm run format        # Format code
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Run tests before pushing
npm run test
npm run test:e2e

# Push changes
git push origin feature/your-feature
```

## Deployment

### Quick Start with Docker

The backend includes Docker configuration for easy deployment.

**Build and Run with Docker Compose:**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

**Docker Compose Services:**
- `postgres`: PostgreSQL database with persistent volume
- `backend`: NestJS application

### Production Deployment

For comprehensive production deployment instructions, including:
- Step-by-step Docker deployment
- Environment variable configuration
- SSL/TLS setup with Nginx or Traefik
- Health checks and monitoring setup
- Automated backup and restore procedures
- Security best practices
- Troubleshooting guide

**See: [DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete Production Deployment Guide

### Quick Production Checklist

Before deploying to production, ensure:

- [ ] Strong database password set
- [ ] `CORS_ORIGIN` configured to frontend domain
- [ ] `NODE_ENV=production` set
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured
- [ ] Health check endpoint accessible
- [ ] Automated backups scheduled
- [ ] Monitoring and alerting set up
- [ ] Database not exposed publicly
- [ ] `.env` file permissions set to 600

For detailed instructions on each item, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Ensure all tests pass (`npm run test && npm run test:e2e`)
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Next Steps

- ✅ NestJS backend initialized
- ✅ Prisma schema defined
- ✅ Love Notes API implemented
- ✅ Comments API implemented
- ✅ Rate limiting implemented
- ✅ Data migration script created
- ✅ Docker configuration added
- ✅ Comprehensive documentation

**Future Enhancements:**
- Add Redis for distributed rate limiting
- Implement caching layer
- Add authentication and user accounts
- Real-time updates with WebSockets
- Advanced analytics and monitoring
- Automated testing in CI/CD pipeline

## License

MIT

---

**Need Help?** Check the [Troubleshooting](#troubleshooting) section or open an issue on GitHub.
