# Design Document: Supabase to NestJS Migration

## Overview

This design document specifies the technical architecture for migrating the Valentine's Love Wall application from a Supabase-based backend to a self-hosted NestJS backend with PostgreSQL and Prisma ORM. The migration maintains all existing functionality while providing a foundation for learning backend development and preparing for production deployment.

### Goals

- Replace Supabase client calls with a self-hosted NestJS REST API
- Implement database-backed rate limiting using PostgreSQL
- Provide type-safe database operations using Prisma ORM
- Maintain identical user experience and functionality
- Enable containerized deployment with Docker
- Preserve all existing data through migration

### Non-Goals

- Adding new features beyond the current Supabase implementation
- Implementing authentication or user accounts
- Real-time subscriptions (current implementation uses polling)
- Advanced caching strategies (can be added later)

## Architecture

### System Components

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        UI[React Components]
        API_CLIENT[Fetch API Client]
    end
    
    subgraph "Backend (NestJS)"
        CONTROLLER[Controllers]
        SERVICE[Services]
        GUARD[Rate Limit Guard]
        PIPE[Validation Pipe]
        PRISMA[Prisma Service]
    end
    
    subgraph "Database (PostgreSQL)"
        NOTES[love_notes table]
        COMMENTS[comments table]
        RATE_LIMITS[rate_limits table]
    end
    
    UI --> API_CLIENT
    API_CLIENT -->|HTTP/JSON| CONTROLLER
    CONTROLLER --> GUARD
    CONTROLLER --> PIPE
    CONTROLLER --> SERVICE
    SERVICE --> PRISMA
    PRISMA --> NOTES
    PRISMA --> COMMENTS
    PRISMA --> RATE_LIMITS
    GUARD --> PRISMA
```

### Technology Stack

**Backend:**
- NestJS 10.x (Node.js framework)
- Prisma 5.x (ORM)
- PostgreSQL 16.x (Database)
- class-validator & class-transformer (Validation)
- @nestjs/throttler (Rate limiting foundation)

**Frontend Changes:**
- Remove @supabase/supabase-js dependency
- Use native fetch API for HTTP requests
- Environment variable for backend URL

**Deployment:**
- Docker & Docker Compose
- PostgreSQL with persistent volumes
- Environment-based configuration

### Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── prisma/
│   │   ├── prisma.module.ts       # Prisma module
│   │   ├── prisma.service.ts      # Prisma client wrapper
│   │   └── schema.prisma          # Database schema
│   ├── love-notes/
│   │   ├── love-notes.module.ts
│   │   ├── love-notes.controller.ts
│   │   ├── love-notes.service.ts
│   │   ├── dto/
│   │   │   ├── create-love-note.dto.ts
│   │   │   └── love-note-response.dto.ts
│   │   └── entities/
│   │       └── love-note.entity.ts
│   ├── comments/
│   │   ├── comments.module.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   ├── dto/
│   │   │   ├── create-comment.dto.ts
│   │   │   └── comment-response.dto.ts
│   │   └── entities/
│   │       └── comment.entity.ts
│   ├── rate-limit/
│   │   ├── rate-limit.module.ts
│   │   ├── rate-limit.service.ts
│   │   └── rate-limit.guard.ts
│   └── common/
│       ├── filters/
│       │   └── http-exception.filter.ts
│       └── interceptors/
│           └── logging.interceptor.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json
```

## Components and Interfaces

### 1. Prisma Service

**Purpose:** Centralized database client management

**Interface:**
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void>
  async onModuleDestroy(): Promise<void>
  async cleanDatabase(): Promise<void> // For testing
}
```

**Responsibilities:**
- Initialize Prisma client on module startup
- Handle graceful shutdown
- Provide typed database access to services

### 2. Love Notes Module

#### Controller
```typescript
@Controller('love-notes')
export class LoveNotesController {
  @Get()
  async findAll(): Promise<LoveNoteResponseDto[]>
  
  @Post()
  @UseGuards(RateLimitGuard)
  async create(@Body() dto: CreateLoveNoteDto, @Ip() ip: string): Promise<LoveNoteResponseDto>
}
```

#### Service
```typescript
@Injectable()
export class LoveNotesService {
  async findAll(): Promise<LoveNote[]>
  async create(data: CreateLoveNoteDto): Promise<LoveNote>
}
```

#### DTOs
```typescript
export class CreateLoveNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  @Transform(({ value }) => value?.trim())
  message: string;

  @IsString()
  @IsOptional()
  @IsIn(['💗', '💘', '💝', '🌹', '✨'])
  emoji?: string;

  @IsString()
  @IsOptional()
  @IsIn(['rose', 'pink', 'red', 'coral', 'lilac'])
  color?: string;
}

export class LoveNoteResponseDto {
  id: string;
  name: string;
  message: string;
  emoji: string;
  color: string;
  created_at: Date;
}
```

### 3. Comments Module

#### Controller
```typescript
@Controller('love-notes/:noteId/comments')
export class CommentsController {
  @Get()
  async findAll(@Param('noteId', ParseUUIDPipe) noteId: string): Promise<CommentResponseDto[]>
  
  @Post()
  @UseGuards(RateLimitGuard)
  async create(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: CreateCommentDto,
    @Ip() ip: string
  ): Promise<CommentResponseDto>
}
```

#### Service
```typescript
@Injectable()
export class CommentsService {
  async findAllByNoteId(noteId: string): Promise<Comment[]>
  async create(noteId: string, data: CreateCommentDto): Promise<Comment>
}
```

#### DTOs
```typescript
export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  comment: string;
}

export class CommentResponseDto {
  id: string;
  name: string;
  comment: string;
  created_at: Date;
}
```

### 4. Rate Limit Module

#### Guard
```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean>
  private extractIp(request: Request): string
  private getRateLimitConfig(path: string): { maxRequests: number; windowMs: number }
}
```

#### Service
```typescript
@Injectable()
export class RateLimitService {
  async checkRateLimit(ip: string, maxRequests: number, windowMs: number): Promise<RateLimitResult>
  async incrementCount(ip: string): Promise<void>
  async resetRateLimit(ip: string, windowMs: number): Promise<void>
  async cleanupExpiredLimits(): Promise<void>
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}
```

**Implementation Strategy:**
The rate limiter uses database-backed storage for persistence across restarts. Each IP address has a record with:
- Current request count
- Reset timestamp

The guard checks the database before allowing requests and updates counts atomically.

### 5. Common Filters and Interceptors

#### HTTP Exception Filter
```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void
}
```

**Purpose:** Standardize error response format to match current API behavior

#### Logging Interceptor
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any>
}
```

**Purpose:** Log all requests and responses for debugging

## Data Models

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model LoveNote {
  id         String    @id @default(uuid()) @db.Uuid
  name       String    @db.VarChar(36)
  message    String    @db.VarChar(240)
  emoji      String    @default("💗") @db.VarChar(10)
  color      String    @default("rose") @db.VarChar(20)
  created_at DateTime  @default(now()) @db.Timestamptz
  comments   Comment[]

  @@map("love_notes")
  @@index([created_at(sort: Desc)])
}

model Comment {
  id         String   @id @default(uuid()) @db.Uuid
  note_id    String   @db.Uuid
  name       String   @db.VarChar(36)
  comment    String   @db.VarChar(200)
  created_at DateTime @default(now()) @db.Timestamptz
  note       LoveNote @relation(fields: [note_id], references: [id], onDelete: Cascade)

  @@map("comments")
  @@index([note_id])
  @@index([created_at])
}

model RateLimit {
  id       String   @id @default(uuid()) @db.Uuid
  ip       String   @unique @db.VarChar(45)
  count    Int      @default(0)
  reset_at DateTime @db.Timestamptz

  @@map("rate_limits")
  @@index([ip])
  @@index([reset_at])
}
```

### Database Indexes

**Performance Considerations:**
- `love_notes.created_at DESC`: Optimizes the main query that fetches recent notes
- `comments.note_id`: Optimizes comment lookups by note
- `comments.created_at`: Supports ordering comments chronologically
- `rate_limits.ip`: Enables fast rate limit lookups
- `rate_limits.reset_at`: Supports cleanup of expired rate limit records

### Data Relationships

```mermaid
erDiagram
    LoveNote ||--o{ Comment : "has many"
    LoveNote {
        uuid id PK
        varchar name
        varchar message
        varchar emoji
        varchar color
        timestamptz created_at
    }
    Comment {
        uuid id PK
        uuid note_id FK
        varchar name
        varchar comment
        timestamptz created_at
    }
    RateLimit {
        uuid id PK
        varchar ip UK
        int count
        timestamptz reset_at
    }
```

## Error Handling

### Error Response Format

All errors follow a consistent JSON structure:

```typescript
{
  "error": string,        // Human-readable error message
  "statusCode": number,   // HTTP status code
  "timestamp": string,    // ISO 8601 timestamp
  "path": string         // Request path
}
```

### Error Categories

**Validation Errors (400):**
- Missing required fields
- Field length violations
- Invalid enum values
- Malformed UUIDs

**Not Found Errors (404):**
- Invalid note_id in comment creation

**Rate Limit Errors (429):**
- Too many requests within time window
- Includes `Retry-After` header with seconds

**Server Errors (500):**
- Database connection failures
- Unexpected exceptions

### Exception Filter Implementation

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      error: typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || 'Internal server error',
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
```

## Testing Strategy

### Property-Based Testing Assessment

**Property-based testing is NOT applicable to this feature** because:

1. **Infrastructure and Configuration**: The project primarily involves NestJS setup, Docker configuration, and database schema definition - these are declarative configurations rather than algorithmic logic
2. **Simple CRUD Operations**: The love notes and comments endpoints perform straightforward database reads and writes without complex transformation logic
3. **Schema Validation**: Request validation uses class-validator decorators, which are better tested with example-based tests covering valid and invalid cases
4. **Stateful Operations**: Rate limiting involves database state management and side effects, making it unsuitable for property-based testing
5. **One-Time Operations**: Data migration is a one-shot operation better validated through integration testing

**Testing Approach**: This feature will use **unit tests** for service logic and **integration tests** for API endpoints and database interactions.

### Unit Testing

**Love Notes Service:**
- Test `findAll()` returns notes ordered by created_at descending
- Test `create()` applies default emoji and color when not provided
- Test `create()` preserves provided emoji and color values
- Test `create()` handles database errors appropriately

**Comments Service:**
- Test `findAllByNoteId()` returns comments ordered by created_at ascending
- Test `findAllByNoteId()` limits results to 50 comments
- Test `create()` associates comment with correct note_id
- Test `create()` throws NotFoundException for invalid note_id

**Rate Limit Service:**
- Test `checkRateLimit()` allows requests under limit
- Test `checkRateLimit()` blocks requests over limit
- Test `checkRateLimit()` resets count after window expires
- Test `incrementCount()` increases count atomically
- Test `cleanupExpiredLimits()` removes old records

**Validation (DTO Unit Tests):**
- Test DTOs reject empty strings after trimming
- Test DTOs reject strings exceeding max length
- Test DTOs reject invalid enum values (emoji, color)
- Test DTOs accept valid inputs with all fields
- Test DTOs accept valid inputs with optional fields omitted
- Test DTOs properly trim whitespace from string fields

### Integration Testing

**Love Notes Endpoints:**
- Test GET /love-notes returns array of notes ordered by created_at descending
- Test GET /love-notes limits results to 100 notes
- Test POST /love-notes creates note and returns 201 with correct structure
- Test POST /love-notes validates required fields (name, message)
- Test POST /love-notes validates field lengths (name ≤ 36, message ≤ 240)
- Test POST /love-notes validates enum values (emoji, color)
- Test POST /love-notes applies defaults when emoji/color omitted
- Test POST /love-notes enforces rate limits (5 requests per 60 seconds)
- Test POST /love-notes returns 429 with Retry-After header when rate limited

**Comments Endpoints:**
- Test GET /love-notes/:id/comments returns comments for note ordered by created_at ascending
- Test GET /love-notes/:id/comments limits results to 50 comments
- Test GET /love-notes/:id/comments returns empty array for note with no comments
- Test POST /love-notes/:id/comments creates comment and returns 201
- Test POST /love-notes/:id/comments validates required fields (name, comment)
- Test POST /love-notes/:id/comments validates field lengths (name ≤ 36, comment ≤ 200)
- Test POST /love-notes/:id/comments returns 404 for invalid note_id
- Test POST /love-notes/:id/comments enforces rate limits (10 requests per 60 seconds)
- Test POST /love-notes/:id/comments returns 429 with Retry-After header when rate limited

**Rate Limiting Integration:**
- Test rate limit allows exactly N requests within window
- Test rate limit blocks N+1 request within window
- Test rate limit returns correct Retry-After value
- Test rate limit resets after time window expires
- Test rate limit persists across service restarts (database-backed)
- Test rate limit tracks different IPs independently

**Error Handling:**
- Test malformed JSON returns 400 with descriptive error
- Test missing Content-Type header is handled gracefully
- Test database connection errors return 500
- Test invalid UUID format in path parameters returns 400

### End-to-End Testing

**Full User Flow:**
- User loads page and sees existing notes
- User creates new note with valid data
- User sees new note appear in list
- User adds comment to note
- User sees comment appear under note
- User hits rate limit and sees error message
- User waits and can post again

**Error Scenarios:**
- Invalid input shows validation error
- Network error shows connection error
- Server error shows generic error message

### Testing Tools

- **Jest**: Unit and integration testing framework
- **Supertest**: HTTP assertion library for API testing
- **@nestjs/testing**: NestJS testing utilities
- **Docker Compose**: Isolated test database for integration tests

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage for services and guards
- **Integration Tests**: All API endpoints with success and error cases
- **E2E Tests**: Critical user flows from frontend to database

## Frontend Integration

### API Client Changes

**Current Implementation (Supabase):**
```typescript
const supabase = createClient(url, key);
const { data, error } = await supabase
  .from('love_wall')
  .select('*')
  .order('created_at', { ascending: false });
```

**New Implementation (Fetch):**
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/love-notes`);
if (!response.ok) {
  const payload = await response.json();
  throw new Error(payload.error || 'Request failed');
}
const { data } = await response.json();
```

### Environment Variables

**Remove:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Add:**
- `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:3001` for development)

### API Endpoints Mapping

| Current Supabase Operation | New REST Endpoint | Method |
|----------------------------|-------------------|--------|
| `from('love_wall').select()` | `/love-notes` | GET |
| `from('love_wall').insert()` | `/love-notes` | POST |
| `from('love_wall_comments').select()` | `/love-notes/:id/comments` | GET |
| `from('love_wall_comments').insert()` | `/love-notes/:id/comments` | POST |

### Response Format Changes

**Supabase Response:**
```typescript
{ data: [...], error: null }
```

**NestJS Response:**
```typescript
// Success
{ data: [...] }

// Error
{ error: "message", statusCode: 400 }
```

### Error Handling Updates

```typescript
// Before (Supabase)
if (error) {
  setError(error.message);
  return;
}

// After (NestJS)
if (!response.ok) {
  const payload = await response.json().catch(() => ({ error: 'Request failed' }));
  setError(payload.error || 'Request failed');
  return;
}
```

### Files to Modify

1. `valentines/app/api/love-wall/route.ts` - Replace with fetch calls to NestJS
2. `valentines/app/api/love-wall/[id]/comments/route.ts` - Replace with fetch calls to NestJS
3. `valentines/components/LoveWall.tsx` - Update API calls
4. `valentines/components/NoteComments.tsx` - Update API calls
5. `valentines/.env.example` - Document new environment variable
6. `valentines/package.json` - Remove @supabase/supabase-js

## Data Migration Strategy

### Migration Script Architecture

```typescript
// scripts/migrate-from-supabase.ts
interface MigrationConfig {
  supabaseUrl: string;
  supabaseKey: string;
  postgresUrl: string;
}

class DataMigrator {
  async migrate(): Promise<MigrationResult>
  private async exportLoveNotes(): Promise<LoveNote[]>
  private async exportComments(): Promise<Comment[]>
  private async importLoveNotes(notes: LoveNote[]): Promise<void>
  private async importComments(comments: Comment[]): Promise<void>
  private async validateMigration(): Promise<ValidationResult>
}
```

### Migration Steps

1. **Export Phase:**
   - Connect to Supabase using service role key
   - Export all records from `love_wall` table
   - Export all records from `love_wall_comments` table
   - Save exports to JSON files as backup

2. **Transform Phase:**
   - Map Supabase field names to Prisma schema
   - Preserve all UUIDs to maintain relationships
   - Preserve all timestamps
   - Validate data integrity

3. **Import Phase:**
   - Connect to PostgreSQL using Prisma
   - Disable foreign key checks temporarily
   - Import love notes in batches
   - Import comments in batches
   - Re-enable foreign key checks

4. **Validation Phase:**
   - Compare record counts
   - Verify random sample of records
   - Check all foreign key relationships
   - Generate migration report

### Idempotency Strategy

```typescript
async migrate() {
  // Check if migration already ran
  const existingCount = await prisma.loveNote.count();
  if (existingCount > 0) {
    console.log('Migration already completed');
    return;
  }
  
  // Proceed with migration
  await this.runMigration();
}
```

### Rollback Strategy

- Keep Supabase data intact during migration
- Test migration on staging environment first
- Maintain JSON backup of exported data
- Document rollback procedure in case of issues

### Migration Command

```bash
npm run migrate:from-supabase
```

## Docker and Deployment Configuration

### Dockerfile (Backend)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-lovewall}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-lovewall}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-lovewall}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-lovewall}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-lovewall}
      PORT: 3001
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:3000}
      NODE_ENV: ${NODE_ENV:-production}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### Environment Variables

**Backend (.env):**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lovewall"

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

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Health Check Endpoint

```typescript
@Controller('health')
export class HealthController {
  @Get()
  async check(): Promise<HealthCheckResult> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: await this.checkDatabase(),
    };
  }
}
```

### Deployment Steps

1. **Prepare Server:**
   - Install Docker and Docker Compose
   - Configure firewall rules
   - Set up SSL/TLS certificates (if needed)

2. **Configure Environment:**
   - Create `.env` file with production values
   - Set strong database password
   - Configure CORS_ORIGIN to frontend domain

3. **Deploy:**
   ```bash
   docker-compose up -d
   ```

4. **Run Migrations:**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

5. **Migrate Data:**
   ```bash
   docker-compose exec backend npm run migrate:from-supabase
   ```

6. **Verify:**
   - Check health endpoint
   - Test API endpoints
   - Verify frontend connectivity

### Monitoring and Logging

**Logging Strategy:**
- Use NestJS built-in logger
- Log all HTTP requests with timestamps
- Log database errors with context
- Log rate limit violations

**Log Levels:**
- `error`: Database failures, unhandled exceptions
- `warn`: Rate limit violations, validation failures
- `log`: HTTP requests, application startup
- `debug`: Detailed operation logs (development only)

**Log Format:**
```typescript
{
  timestamp: '2024-01-15T10:30:00.000Z',
  level: 'log',
  context: 'LoveNotesController',
  message: 'POST /love-notes',
  ip: '192.168.1.1',
  duration: 45
}
```

## Development and Production Environment Setup

### Local Development Setup

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start PostgreSQL:**
   ```bash
   docker-compose up postgres -d
   ```

3. **Run Migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Start Backend:**
   ```bash
   npm run start:dev
   ```

5. **Start Frontend:**
   ```bash
   cd ../valentines
   npm run dev
   ```

### Development Workflow

**Database Changes:**
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Prisma generates migration SQL and updates client

**Adding Endpoints:**
1. Create/update DTO in `dto/` folder
2. Add method to service
3. Add route to controller
4. Write tests
5. Update API documentation

**Testing:**
```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Production Environment

**Security Considerations:**
- Use strong database passwords
- Enable SSL for database connections
- Configure CORS to allow only frontend domain
- Use environment variables for all secrets
- Keep dependencies updated
- Enable rate limiting on all POST endpoints

**Performance Optimization:**
- Use connection pooling (Prisma default)
- Add database indexes for common queries
- Enable gzip compression
- Consider adding Redis for caching (future enhancement)

**Backup Strategy:**
- Regular PostgreSQL backups using pg_dump
- Store backups in separate location
- Test restore procedure regularly

### Scaling Considerations

**Current Architecture:**
- Single backend instance
- Single database instance
- Suitable for moderate traffic

**Future Enhancements:**
- Add Redis for rate limiting (distributed)
- Horizontal scaling with load balancer
- Database read replicas
- CDN for static assets

## Documentation Requirements

### README.md Structure

1. **Project Overview**
   - Description of the application
   - Technology stack
   - Architecture diagram

2. **Prerequisites**
   - Node.js version
   - Docker and Docker Compose
   - PostgreSQL (if not using Docker)

3. **Local Development Setup**
   - Step-by-step installation
   - Environment variable configuration
   - Running migrations
   - Starting the application

4. **API Documentation**
   - Endpoint list with examples
   - Request/response formats
   - Error codes and messages

5. **Database Schema**
   - Entity relationship diagram
   - Table descriptions
   - Migration commands

6. **Testing**
   - Running tests
   - Writing new tests
   - Test coverage

7. **Deployment**
   - Docker deployment
   - Environment configuration
   - Health checks
   - Monitoring

8. **Data Migration**
   - Migration script usage
   - Validation steps
   - Rollback procedure

9. **Troubleshooting**
   - Common issues and solutions
   - Debugging tips
   - Log locations

### API Documentation Format

Each endpoint should document:

**GET /love-notes**
```
Description: Retrieve all love notes
Method: GET
Authentication: None
Rate Limit: None

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "message": "string",
      "emoji": "string",
      "color": "string",
      "created_at": "ISO 8601"
    }
  ]
}

Response 500:
{
  "error": "string",
  "statusCode": 500
}
```

### Code Comments

**Service Methods:**
```typescript
/**
 * Creates a new love note with the provided data.
 * Applies default values for emoji and color if not provided.
 * 
 * @param data - The love note data from the validated DTO
 * @returns The created love note with generated ID and timestamp
 * @throws InternalServerErrorException if database operation fails
 */
async create(data: CreateLoveNoteDto): Promise<LoveNote> {
  // Implementation
}
```

**Complex Logic:**
```typescript
// Extract IP from x-forwarded-for header (proxy/load balancer)
// Falls back to x-real-ip, then 'unknown' if neither present
const ip = request.headers['x-forwarded-for']?.split(',')[0]?.trim() 
  || request.headers['x-real-ip'] 
  || 'unknown';
```

## Summary

This design provides a complete migration path from Supabase to a self-hosted NestJS backend while maintaining all existing functionality. The architecture emphasizes:

- **Type Safety**: Prisma and TypeScript throughout
- **Validation**: class-validator for all inputs
- **Reliability**: Database-backed rate limiting
- **Maintainability**: Clear module structure and documentation
- **Deployability**: Docker containerization
- **Testability**: Comprehensive testing strategy

The implementation preserves the current user experience while providing a foundation for future enhancements and learning opportunities in backend development.
