# Implementation Plan: Supabase to NestJS Migration

## Overview

This implementation plan converts the Valentine's Love Wall application from a Supabase-based backend to a self-hosted NestJS backend with PostgreSQL and Prisma ORM. The tasks are ordered to build incrementally, validating functionality at each checkpoint.

## Tasks

- [x] 1. Initialize NestJS backend project structure
  - Create new NestJS application in `backend/` directory
  - Install core dependencies: @nestjs/common, @nestjs/core, @nestjs/platform-express
  - Install Prisma dependencies: @prisma/client, prisma (dev)
  - Install validation dependencies: class-validator, class-transformer
  - Set up TypeScript configuration
  - Create basic project structure: src/main.ts, src/app.module.ts
  - Configure CORS to allow requests from frontend
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 2. Set up Prisma and database schema
  - [x] 2.1 Initialize Prisma and create schema
    - Run `npx prisma init`
    - Define LoveNote model with fields: id (UUID), name, message, emoji, color, created_at
    - Define Comment model with fields: id (UUID), note_id (FK), name, comment, created_at
    - Define RateLimit model with fields: id (UUID), ip (unique), count, reset_at
    - Add indexes: love_notes.created_at DESC, comments.note_id, comments.created_at, rate_limits.ip, rate_limits.reset_at
    - Configure foreign key relationship: Comment.note_id → LoveNote.id with CASCADE delete
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 2.2 Create Prisma service module
    - Create src/prisma/prisma.module.ts
    - Create src/prisma/prisma.service.ts extending PrismaClient
    - Implement onModuleInit to connect to database
    - Implement onModuleDestroy for graceful shutdown
    - Export PrismaService as global module
    - _Requirements: 1.2, 2.8_

- [ ] 3. Implement Love Notes module
  - [x] 3.1 Create Love Notes DTOs and entities
    - Create src/love-notes/dto/create-love-note.dto.ts
    - Add validation decorators: @IsString, @IsNotEmpty, @MaxLength(36) for name
    - Add validation decorators: @MaxLength(240) for message
    - Add validation decorators: @IsOptional, @IsIn for emoji and color
    - Add @Transform decorator to trim whitespace
    - Create src/love-notes/dto/love-note-response.dto.ts
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.1, 6.2, 6.3, 6.5_
  
  - [x] 3.2 Implement Love Notes service
    - Create src/love-notes/love-notes.service.ts
    - Implement findAll() method: query up to 100 notes ordered by created_at DESC
    - Implement create() method: insert note with defaults (emoji: 💗, color: rose)
    - Handle database errors and throw appropriate exceptions
    - _Requirements: 3.1, 3.2, 3.6_
  
  - [x] 3.3 Implement Love Notes controller
    - Create src/love-notes/love-notes.controller.ts
    - Add GET /love-notes endpoint calling service.findAll()
    - Add POST /love-notes endpoint with @Body validation
    - Apply ValidationPipe globally in main.ts
    - Return 201 status for successful creation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.4_
  
  - [x] 3.4 Create Love Notes module
    - Create src/love-notes/love-notes.module.ts
    - Import PrismaModule
    - Register controller and service
    - Export service for testing
    - _Requirements: 1.1_
  
  - [ ]*  3.5 Write unit tests for Love Notes service
    - Test findAll() returns notes ordered by created_at descending
    - Test create() applies default emoji and color when not provided
    - Test create() preserves provided emoji and color values
    - Test create() handles database errors appropriately
    - _Requirements: 3.1, 3.2, 3.6_

- [ ] 4. Implement Comments module
  - [x] 4.1 Create Comments DTOs and entities
    - Create src/comments/dto/create-comment.dto.ts
    - Add validation decorators: @IsString, @IsNotEmpty, @MaxLength(36) for name
    - Add validation decorators: @MaxLength(200) for comment
    - Add @Transform decorator to trim whitespace
    - Create src/comments/dto/comment-response.dto.ts
    - _Requirements: 4.3, 4.4, 4.5, 6.1, 6.2, 6.3_
  
  - [x] 4.2 Implement Comments service
    - Create src/comments/comments.service.ts
    - Implement findAllByNoteId() method: query up to 50 comments ordered by created_at ASC
    - Implement create() method: insert comment with note_id foreign key
    - Throw NotFoundException when note_id is invalid
    - Handle database errors appropriately
    - _Requirements: 4.1, 4.2, 4.6_
  
  - [x] 4.3 Implement Comments controller
    - Create src/comments/comments.controller.ts
    - Add GET /love-notes/:noteId/comments endpoint with ParseUUIDPipe
    - Add POST /love-notes/:noteId/comments endpoint with @Body validation
    - Return 201 status for successful creation
    - Return 404 for invalid noteId
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.6_
  
  - [x] 4.4 Create Comments module
    - Create src/comments/comments.module.ts
    - Import PrismaModule
    - Register controller and service
    - Export service for testing
    - _Requirements: 1.1_
  
  - [ ]* 4.5 Write unit tests for Comments service
    - Test findAllByNoteId() returns comments ordered by created_at ascending
    - Test findAllByNoteId() limits results to 50 comments
    - Test create() associates comment with correct note_id
    - Test create() throws NotFoundException for invalid note_id
    - _Requirements: 4.1, 4.2, 4.6_

- [ ] 5. Implement database-backed rate limiting
  - [x] 5.1 Create Rate Limit service
    - Create src/rate-limit/rate-limit.service.ts
    - Implement checkRateLimit(ip, maxRequests, windowMs): check count and reset_at
    - Implement incrementCount(ip): atomically increment request count
    - Implement resetRateLimit(ip, windowMs): create/update rate limit record with new reset_at
    - Implement cleanupExpiredLimits(): delete records where reset_at < now
    - Return { allowed: boolean, retryAfter?: number } from checkRateLimit
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_
  
  - [x] 5.2 Create Rate Limit guard
    - Create src/rate-limit/rate-limit.guard.ts implementing CanActivate
    - Extract IP from x-forwarded-for or x-real-ip headers
    - Get rate limit config based on request path: /love-notes (5 req/60s), /comments (10 req/60s)
    - Call rate-limit.service.checkRateLimit()
    - If blocked, throw HttpException with status 429 and Retry-After header
    - If allowed, call incrementCount() and return true
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [x] 5.3 Create Rate Limit module and apply guard
    - Create src/rate-limit/rate-limit.module.ts
    - Import PrismaModule
    - Register service and guard
    - Apply @UseGuards(RateLimitGuard) to POST endpoints in Love Notes and Comments controllers
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 5.4 Write unit tests for Rate Limit service
    - Test checkRateLimit() allows requests under limit
    - Test checkRateLimit() blocks requests over limit
    - Test checkRateLimit() resets count after window expires
    - Test incrementCount() increases count atomically
    - Test cleanupExpiredLimits() removes old records
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Implement error handling and logging
  - [~] 6.1 Create HTTP exception filter
    - Create src/common/filters/http-exception.filter.ts
    - Implement @Catch(HttpException) decorator
    - Format error response: { error, statusCode, timestamp, path }
    - Handle validation errors from class-validator
    - Register filter globally in main.ts
    - _Requirements: 1.7, 6.4_
  
  - [~] 6.2 Create logging interceptor
    - Create src/common/interceptors/logging.interceptor.ts
    - Log all incoming requests with method, path, IP, timestamp
    - Log response status and duration
    - Use NestJS Logger with appropriate log levels
    - Register interceptor globally in main.ts
    - _Requirements: 9.5_
  
  - [~] 6.3 Add health check endpoint
    - Create src/health/health.controller.ts
    - Implement GET /health endpoint
    - Return { status: 'ok', timestamp, database: 'connected' }
    - Test database connection using Prisma.$queryRaw
    - _Requirements: 9.4_

- [~] 7. Checkpoint - Backend API complete
  - Run `npm run build` to verify TypeScript compilation
  - Start backend with `npm run start:dev`
  - Test GET /love-notes returns empty array
  - Test POST /love-notes creates note and returns 201
  - Test GET /health returns 200
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Update frontend to use NestJS API
  - [~] 8.1 Remove Supabase dependencies
    - Remove @supabase/supabase-js from valentines/package.json
    - Run `npm install` to update lock file
    - Update valentines/.env.example to document NEXT_PUBLIC_API_URL
    - Create valentines/.env.local with NEXT_PUBLIC_API_URL=http://localhost:3001
    - _Requirements: 7.5, 7.6_
  
  - [~] 8.2 Update Love Wall API route
    - Modify valentines/app/api/love-wall/route.ts
    - Replace Supabase client with fetch to ${NEXT_PUBLIC_API_URL}/love-notes
    - Handle GET request: fetch and return notes
    - Handle POST request: fetch with body and return created note
    - Implement error handling: check response.ok, parse error payload
    - Return appropriate status codes and error messages
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [~] 8.3 Update Comments API route
    - Modify valentines/app/api/love-wall/[id]/comments/route.ts
    - Replace Supabase client with fetch to ${NEXT_PUBLIC_API_URL}/love-notes/:id/comments
    - Handle GET request: fetch and return comments
    - Handle POST request: fetch with body and return created comment
    - Implement error handling for 404 (invalid note ID) and 429 (rate limit)
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [~] 8.4 Update frontend components
    - Modify valentines/components/LoveWall.tsx to handle new error format
    - Modify valentines/components/NoteComments.tsx to handle new error format
    - Update error messages to display payload.error from API responses
    - Ensure UI remains unchanged (same user experience)
    - _Requirements: 7.3, 7.4_

- [ ] 9. Create data migration script
  - [~] 9.1 Implement migration script
    - Create backend/scripts/migrate-from-supabase.ts
    - Install @supabase/supabase-js as dev dependency for migration
    - Implement exportLoveNotes(): fetch all from Supabase love_wall table
    - Implement exportComments(): fetch all from Supabase love_wall_comments table
    - Implement importLoveNotes(): batch insert into PostgreSQL using Prisma
    - Implement importComments(): batch insert into PostgreSQL using Prisma
    - Save exports to JSON files as backup
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [~] 9.2 Add migration validation and idempotency
    - Check if migration already ran (count existing records)
    - Implement validateMigration(): compare record counts between Supabase and PostgreSQL
    - Verify random sample of records match
    - Check all foreign key relationships are intact
    - Generate migration report with counts and validation results
    - Add logging for migration progress and errors
    - _Requirements: 8.5, 8.6, 8.7_
  
  - [~] 9.3 Add migration npm script
    - Add "migrate:from-supabase" script to backend/package.json
    - Document migration command in backend/README.md
    - Include environment variables needed: SUPABASE_URL, SUPABASE_KEY, DATABASE_URL
    - _Requirements: 8.6_

- [ ] 10. Create Docker deployment configuration
  - [~] 10.1 Create Dockerfile for backend
    - Create backend/Dockerfile with multi-stage build
    - Stage 1: Install dependencies and build TypeScript
    - Stage 2: Copy built files and run prisma generate
    - Set CMD to run migrations then start server: "npx prisma migrate deploy && node dist/main"
    - Expose port 3001
    - _Requirements: 9.1_
  
  - [~] 10.2 Create docker-compose.yml
    - Create backend/docker-compose.yml
    - Define postgres service: PostgreSQL 16-alpine with persistent volume
    - Define backend service: build from Dockerfile, depends on postgres
    - Configure environment variables: DATABASE_URL, PORT, CORS_ORIGIN, NODE_ENV
    - Add health check for postgres: pg_isready
    - Configure restart policy: unless-stopped
    - _Requirements: 9.1, 9.2, 9.3, 9.7_
  
  - [~] 10.3 Create environment configuration files
    - Create backend/.env.example with all required variables documented
    - Document: DATABASE_URL, PORT, NODE_ENV, CORS_ORIGIN
    - Document rate limit configuration: RATE_LIMIT_NOTES_MAX, RATE_LIMIT_NOTES_WINDOW_MS
    - Add comments explaining each variable
    - _Requirements: 9.3_

- [ ] 11. Write integration tests
  - [ ]* 11.1 Write Love Notes endpoint integration tests
    - Test GET /love-notes returns array ordered by created_at descending
    - Test GET /love-notes limits results to 100 notes
    - Test POST /love-notes creates note and returns 201
    - Test POST /love-notes validates required fields (400 for missing name/message)
    - Test POST /love-notes validates field lengths (400 for name > 36, message > 240)
    - Test POST /love-notes validates enum values (400 for invalid emoji/color)
    - Test POST /love-notes applies defaults when emoji/color omitted
    - Test POST /love-notes enforces rate limits (429 after 5 requests in 60s)
    - Test POST /love-notes returns Retry-After header when rate limited
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1, 5.2, 5.3_
  
  - [ ]* 11.2 Write Comments endpoint integration tests
    - Test GET /love-notes/:id/comments returns comments ordered by created_at ascending
    - Test GET /love-notes/:id/comments limits results to 50 comments
    - Test GET /love-notes/:id/comments returns empty array for note with no comments
    - Test POST /love-notes/:id/comments creates comment and returns 201
    - Test POST /love-notes/:id/comments validates required fields (400 for missing name/comment)
    - Test POST /love-notes/:id/comments validates field lengths (400 for name > 36, comment > 200)
    - Test POST /love-notes/:id/comments returns 404 for invalid note_id
    - Test POST /love-notes/:id/comments enforces rate limits (429 after 10 requests in 60s)
    - Test POST /love-notes/:id/comments returns Retry-After header when rate limited
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3_
  
  - [ ]* 11.3 Write rate limiting integration tests
    - Test rate limit allows exactly N requests within window
    - Test rate limit blocks N+1 request within window
    - Test rate limit returns correct Retry-After value
    - Test rate limit resets after time window expires
    - Test rate limit persists across service restarts (database-backed)
    - Test rate limit tracks different IPs independently
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_
  
  - [ ]* 11.4 Write error handling integration tests
    - Test malformed JSON returns 400 with descriptive error
    - Test missing Content-Type header is handled gracefully
    - Test invalid UUID format in path parameters returns 400
    - Test database connection errors return 500
    - _Requirements: 1.7, 6.4, 6.6_

- [ ] 12. Create comprehensive documentation
  - [~] 12.1 Write backend README.md
    - Add project overview and technology stack
    - Document prerequisites: Node.js 20+, Docker, PostgreSQL
    - Write local development setup instructions
    - Document environment variables with examples
    - Document database migration commands
    - Document testing commands: npm run test, npm run test:e2e
    - _Requirements: 10.1, 10.3, 10.4_
  
  - [~] 12.2 Document API endpoints
    - Document GET /love-notes with request/response examples
    - Document POST /love-notes with validation rules and examples
    - Document GET /love-notes/:id/comments with examples
    - Document POST /love-notes/:id/comments with validation rules and examples
    - Document GET /health endpoint
    - Document error response format and status codes
    - Include rate limit information for each endpoint
    - _Requirements: 10.2_
  
  - [~] 12.3 Document deployment process
    - Write step-by-step Docker deployment instructions
    - Document production environment variable configuration
    - Document SSL/TLS setup recommendations
    - Document health check and monitoring setup
    - Document backup and restore procedures
    - _Requirements: 10.6_
  
  - [~] 12.4 Document data migration process
    - Write step-by-step migration instructions
    - Document required environment variables for migration
    - Document validation steps to verify migration success
    - Document rollback procedure if migration fails
    - Include troubleshooting tips
    - _Requirements: 10.5_

- [~] 13. Final checkpoint - Complete system validation
  - Start backend with Docker Compose: `docker-compose up -d`
  - Verify health check endpoint returns 200
  - Start frontend: `cd valentines && npm run dev`
  - Test creating love notes through UI
  - Test viewing love notes in wall
  - Test adding comments to notes
  - Test rate limiting by submitting multiple notes quickly
  - Verify all data persists after backend restart
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of functionality
- The implementation uses TypeScript throughout for type safety
- Database-backed rate limiting ensures persistence across restarts
- Docker configuration enables easy deployment to any server
- Migration script preserves all existing Supabase data
