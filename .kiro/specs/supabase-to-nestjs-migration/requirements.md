# Requirements Document

## Introduction

This document specifies the requirements for migrating the Valentine's Love Wall application from a Supabase-based backend to a self-hosted NestJS backend with PostgreSQL database. The migration aims to provide a learning opportunity for backend development while maintaining all existing functionality and preparing the system for production deployment.

## Glossary

- **Frontend_Application**: The Next.js web application that provides the user interface for the Love Wall
- **Backend_API**: The NestJS REST API server that handles business logic and data operations
- **Database**: The self-hosted PostgreSQL database that stores love wall notes, comments, and rate limit data
- **Love_Note**: A user-submitted message containing name, message text, emoji, color, and timestamp
- **Comment**: A reply to a Love_Note containing name, comment text, and timestamp
- **Rate_Limiter**: The system component that prevents abuse by limiting request frequency per IP address
- **ORM**: Prisma Object-Relational Mapping tool for database operations
- **Validator**: The system component that validates incoming request data using class-validator
- **Migration_Script**: A utility that transfers existing data from Supabase to the new PostgreSQL database

## Requirements

### Requirement 1: NestJS Backend API Setup

**User Story:** As a developer, I want to set up a NestJS backend application, so that I can replace Supabase with a self-hosted solution.

#### Acceptance Criteria

1. THE Backend_API SHALL be initialized as a NestJS TypeScript application with proper project structure
2. THE Backend_API SHALL use Prisma as the ORM for database operations
3. THE Backend_API SHALL use class-validator for request validation
4. THE Backend_API SHALL expose REST API endpoints accessible from external networks
5. THE Backend_API SHALL include CORS configuration to allow requests from the Frontend_Application domain
6. THE Backend_API SHALL include environment-based configuration for database connection and server port
7. THE Backend_API SHALL include proper error handling middleware that returns consistent error responses

### Requirement 2: PostgreSQL Database Schema

**User Story:** As a developer, I want to define the database schema using Prisma, so that I can store love wall data in a self-hosted PostgreSQL database.

#### Acceptance Criteria

1. THE Database SHALL include a table for Love_Notes with columns: id, name, message, emoji, color, created_at
2. THE Database SHALL include a table for Comments with columns: id, note_id, name, comment, created_at
3. THE Database SHALL include a table for rate limits with columns: id, ip, count, reset_at
4. THE Database SHALL enforce a foreign key relationship between Comments and Love_Notes
5. THE Database SHALL use UUID type for Love_Note and Comment identifiers
6. THE Database SHALL use timestamp with timezone for all created_at and reset_at fields
7. THE Database SHALL include appropriate indexes on note_id for Comments and ip for rate limits
8. THE ORM SHALL generate TypeScript types from the database schema

### Requirement 3: Love Notes API Endpoints

**User Story:** As a user, I want to create and view love notes through API endpoints, so that I can share messages on the love wall.

#### Acceptance Criteria

1. WHEN a GET request is sent to /love-notes, THE Backend_API SHALL return up to 100 Love_Notes ordered by created_at descending
2. WHEN a POST request is sent to /love-notes with valid data, THE Backend_API SHALL create a new Love_Note and return it with status 201
3. WHEN a POST request is sent to /love-notes with missing name or message, THE Backend_API SHALL return an error with status 400
4. WHEN a POST request is sent to /love-notes with name exceeding 36 characters, THE Backend_API SHALL return an error with status 400
5. WHEN a POST request is sent to /love-notes with message exceeding 240 characters, THE Backend_API SHALL return an error with status 400
6. WHEN a POST request is sent to /love-notes without emoji or color, THE Backend_API SHALL use default values (emoji: 💗, color: rose)
7. THE Backend_API SHALL validate that emoji is one of the allowed values: 💗, 💘, 💝, 🌹, ✨
8. THE Backend_API SHALL validate that color is one of the allowed values: rose, pink, red, coral, lilac

### Requirement 4: Comments API Endpoints

**User Story:** As a user, I want to add and view comments on love notes through API endpoints, so that I can reply to messages.

#### Acceptance Criteria

1. WHEN a GET request is sent to /love-notes/:id/comments, THE Backend_API SHALL return up to 50 Comments for the specified Love_Note ordered by created_at ascending
2. WHEN a POST request is sent to /love-notes/:id/comments with valid data, THE Backend_API SHALL create a new Comment and return it with status 201
3. WHEN a POST request is sent to /love-notes/:id/comments with missing name or comment, THE Backend_API SHALL return an error with status 400
4. WHEN a POST request is sent to /love-notes/:id/comments with name exceeding 36 characters, THE Backend_API SHALL return an error with status 400
5. WHEN a POST request is sent to /love-notes/:id/comments with comment exceeding 200 characters, THE Backend_API SHALL return an error with status 400
6. WHEN a POST request is sent to /love-notes/:id/comments with an invalid note_id, THE Backend_API SHALL return an error with status 404

### Requirement 5: Rate Limiting

**User Story:** As a system administrator, I want to rate limit API requests by IP address, so that I can prevent abuse and spam.

#### Acceptance Criteria

1. WHEN a POST request is sent to /love-notes, THE Rate_Limiter SHALL allow a maximum of 5 requests per IP address within a 60-second window
2. WHEN a POST request is sent to /love-notes/:id/comments, THE Rate_Limiter SHALL allow a maximum of 10 requests per IP address within a 60-second window
3. WHEN the rate limit is exceeded, THE Backend_API SHALL return an error with status 429 and a Retry-After header
4. WHEN the rate limit window expires, THE Rate_Limiter SHALL reset the request count for that IP address
5. THE Rate_Limiter SHALL extract the client IP from x-forwarded-for or x-real-ip headers
6. THE Rate_Limiter SHALL use the Database to persist rate limit state across server restarts

### Requirement 6: Request Validation

**User Story:** As a developer, I want to validate all incoming API requests, so that I can ensure data integrity and provide clear error messages.

#### Acceptance Criteria

1. THE Validator SHALL validate that all required fields are present in request bodies
2. THE Validator SHALL validate that string fields do not exceed maximum length constraints
3. THE Validator SHALL validate that string fields are properly trimmed of whitespace
4. WHEN validation fails, THE Backend_API SHALL return a 400 status with a descriptive error message
5. THE Validator SHALL validate that enum fields (emoji, color) contain only allowed values
6. THE Validator SHALL validate that UUID parameters are properly formatted

### Requirement 7: Frontend Integration

**User Story:** As a developer, I want to update the Next.js frontend to call the new NestJS API, so that the application works with the self-hosted backend.

#### Acceptance Criteria

1. THE Frontend_Application SHALL replace all Supabase client calls with fetch requests to the Backend_API
2. THE Frontend_Application SHALL use environment variables to configure the Backend_API base URL
3. THE Frontend_Application SHALL handle API errors and display appropriate error messages to users
4. THE Frontend_Application SHALL maintain the same user interface and user experience as the current implementation
5. THE Frontend_Application SHALL remove the @supabase/supabase-js dependency from package.json
6. THE Frontend_Application SHALL update the .env.example file to document the new Backend_API URL variable

### Requirement 8: Data Migration

**User Story:** As a developer, I want to migrate existing data from Supabase to PostgreSQL, so that I can preserve all existing love notes and comments.

#### Acceptance Criteria

1. THE Migration_Script SHALL export all Love_Notes from the Supabase love_wall table
2. THE Migration_Script SHALL export all Comments from the Supabase love_wall_comments table
3. THE Migration_Script SHALL import Love_Notes into the new PostgreSQL Database preserving all fields and timestamps
4. THE Migration_Script SHALL import Comments into the new PostgreSQL Database preserving all fields and relationships
5. THE Migration_Script SHALL validate that all records were successfully migrated by comparing record counts
6. THE Migration_Script SHALL provide clear logging of migration progress and any errors
7. THE Migration_Script SHALL be idempotent, allowing safe re-execution without duplicating data

### Requirement 9: Production Deployment Configuration

**User Story:** As a developer, I want to configure the backend for production deployment, so that it can run reliably outside of localhost.

#### Acceptance Criteria

1. THE Backend_API SHALL include a Dockerfile for containerized deployment
2. THE Backend_API SHALL include a docker-compose.yml file that orchestrates the Backend_API and Database
3. THE Backend_API SHALL use environment variables for all configuration (database URL, port, CORS origins)
4. THE Backend_API SHALL include health check endpoints for monitoring
5. THE Backend_API SHALL log all requests and errors with appropriate log levels
6. THE Backend_API SHALL include documentation for deployment on a self-hosted server
7. THE Database SHALL be configured with persistent volume storage to prevent data loss

### Requirement 10: Development Documentation

**User Story:** As a developer, I want comprehensive documentation, so that I can understand and maintain the backend system.

#### Acceptance Criteria

1. THE Backend_API SHALL include a README.md with setup instructions for local development
2. THE Backend_API SHALL include documentation for all API endpoints with request/response examples
3. THE Backend_API SHALL include documentation for environment variables and configuration options
4. THE Backend_API SHALL include documentation for running database migrations
5. THE Backend_API SHALL include documentation for the data migration process from Supabase
6. THE Backend_API SHALL include documentation for production deployment steps
7. THE Backend_API SHALL include code comments explaining complex business logic
