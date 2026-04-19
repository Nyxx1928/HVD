# Lesson: Prisma Schema Setup for Love Wall Database

## Task Context

- Goal: Initialize Prisma ORM and define the database schema for the Valentine's Love Wall application
- Scope: Create three models (LoveNote, Comment, RateLimit) with proper relationships, indexes, and constraints
- Constraints: Must support UUID primary keys, foreign key relationships with CASCADE delete, and optimized indexes for common queries

## Step-by-Step Changes

1. **Initialize Prisma**: Ran `npx prisma init` in the backend directory, which created:
   - `prisma/schema.prisma` - The schema definition file
   - `.env` - Environment variables file (with DATABASE_URL placeholder)

2. **Define LoveNote Model**: Created the main model for love notes with:
   - UUID primary key with auto-generation
   - String fields with length constraints (name: 36 chars, message: 240 chars)
   - Default values for emoji (💗) and color (rose)
   - Timestamp with timezone for created_at
   - One-to-many relationship with comments
   - Descending index on created_at for efficient "newest first" queries

3. **Define Comment Model**: Created the comments model with:
   - UUID primary key
   - Foreign key (note_id) referencing LoveNote with CASCADE delete
   - String fields with length constraints (name: 36 chars, comment: 200 chars)
   - Timestamp with timezone for created_at
   - Indexes on note_id (for lookups) and created_at (for ordering)

4. **Define RateLimit Model**: Created the rate limiting model with:
   - UUID primary key
   - Unique IP address field (supports IPv6 with 45 char limit)
   - Integer count field with default 0
   - Timestamp for reset_at
   - Indexes on ip (for fast lookups) and reset_at (for cleanup queries)

5. **Configure Database Mapping**: Used `@@map()` to specify table names (love_notes, comments, rate_limits) following PostgreSQL naming conventions

## Why This Approach

- **Prisma ORM**: Provides type-safe database access with auto-generated TypeScript types, reducing runtime errors and improving developer experience
- **UUID Primary Keys**: Better for distributed systems and prevent enumeration attacks compared to auto-incrementing integers
- **Explicit Length Constraints**: Enforces data validation at the database level, matching the application-level validation rules
- **Strategic Indexes**: Optimizes the most common queries:
  - `love_notes.created_at DESC` - Main page loads notes in reverse chronological order
  - `comments.note_id` - Fetching comments for a specific note
  - `comments.created_at` - Ordering comments chronologically
  - `rate_limits.ip` - Fast rate limit checks by IP address
  - `rate_limits.reset_at` - Efficient cleanup of expired rate limit records
- **CASCADE Delete**: Automatically removes comments when a love note is deleted, maintaining referential integrity without orphaned records
- **Timestamp with Timezone**: Ensures consistent time handling across different server locations

## Alternatives Considered

- **Option 1: TypeORM instead of Prisma**
  - Pros: More flexible, decorator-based approach similar to NestJS style
  - Cons: Less type-safe, requires more boilerplate, migrations are more complex
  - Decision: Prisma chosen for superior type safety and simpler migration workflow

- **Option 2: Auto-incrementing Integer IDs**
  - Pros: Smaller storage size, simpler to work with
  - Cons: Exposes record count, predictable IDs can be security issue, harder to merge databases
  - Decision: UUIDs chosen for better security and scalability

- **Option 3: Separate Rate Limit Service (Redis)**
  - Pros: Faster in-memory operations, built-in TTL support
  - Cons: Additional infrastructure dependency, more complex deployment
  - Decision: Database-backed rate limiting chosen for simplicity and persistence across restarts

## Key Concepts

- **ORM (Object-Relational Mapping)**: Prisma maps database tables to TypeScript objects, allowing you to work with type-safe models instead of raw SQL
- **Schema-First Development**: Define your data structure in `schema.prisma`, then generate both the database schema (via migrations) and TypeScript types
- **Foreign Key Relationships**: The `@relation` directive creates a database-level constraint ensuring comments always reference valid love notes
- **Database Indexes**: Speed up queries by creating sorted data structures for frequently searched columns (trade-off: slower writes, faster reads)
- **Cascade Delete**: When a parent record (LoveNote) is deleted, all child records (Comments) are automatically deleted
- **UUID vs Auto-increment**: UUIDs are globally unique identifiers that can be generated anywhere, while auto-increment IDs require database coordination

## Potential Pitfalls

- **Missing DATABASE_URL**: Prisma requires a valid PostgreSQL connection string in `.env` before running migrations. Make sure to create a `.env` file based on `.env.example`
- **Index Over-optimization**: Too many indexes slow down writes. We only indexed columns used in WHERE clauses and ORDER BY statements
- **Timezone Confusion**: Always use `@db.Timestamptz` (timestamp with timezone) instead of plain timestamp to avoid timezone-related bugs
- **String Length Mismatches**: Ensure DTO validation max lengths match database VARCHAR constraints (e.g., name is 36 chars in both)
- **Forgetting to Generate Client**: After schema changes, you must run `npx prisma generate` to update the TypeScript types (or `npx prisma migrate dev` which does both)
- **Unique Constraint on IP**: The `@unique` on rate_limits.ip means each IP can only have one rate limit record. This is intentional but could cause issues if you need per-endpoint rate limiting later

## What You Learned

- How to initialize Prisma in a NestJS project using `npx prisma init`
- How to define database models with proper types, constraints, and relationships in Prisma schema language
- How to create foreign key relationships with cascade delete behavior
- How to add database indexes to optimize query performance
- How to use `@@map()` to control table naming in the database
- How to specify PostgreSQL-specific types like `@db.Uuid`, `@db.VarChar()`, and `@db.Timestamptz`
- The trade-offs between different ID strategies (UUID vs auto-increment)
- The importance of matching database constraints with application-level validation
- How database indexes improve read performance at the cost of write performance
