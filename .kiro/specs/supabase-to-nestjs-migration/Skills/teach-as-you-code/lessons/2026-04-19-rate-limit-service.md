# Lesson: Database-Backed Rate Limiting Service

## Task Context

- **Goal:** Create a rate limiting service that prevents API abuse by tracking request counts per IP address using PostgreSQL as persistent storage
- **Scope:** Implement `RateLimitService` with methods to check limits, increment counts, reset windows, and cleanup expired records
- **Constraints:** Must persist across server restarts, handle concurrent requests safely, and provide retry timing information

## Step-by-Step Changes

1. **Created the service file** at `backend/src/rate-limit/rate-limit.service.ts` with dependency injection of `PrismaService`

2. **Defined the `RateLimitResult` interface** to standardize the return type:
   ```typescript
   export interface RateLimitResult {
     allowed: boolean;
     retryAfter?: number;  // Seconds until retry is allowed
   }
   ```

3. **Implemented `checkRateLimit()` method** that:
   - Queries the database for existing rate limit record by IP
   - Returns `allowed: true` if no record exists (first request)
   - Checks if the time window has expired and allows request if so
   - Compares current count against `maxRequests` limit
   - Calculates `retryAfter` in seconds when limit is exceeded

4. **Implemented `incrementCount()` method** that:
   - Uses Prisma's atomic `increment` operation to safely increase the count
   - Handles edge cases where the record might not exist or be expired
   - Ensures thread-safe updates in concurrent scenarios

5. **Implemented `resetRateLimit()` method** that:
   - Uses Prisma's `upsert` to create or update the rate limit record
   - Sets count to 1 (the current request)
   - Calculates new `reset_at` timestamp based on `windowMs`
   - Handles both new IPs and existing records with expired windows

6. **Implemented `cleanupExpiredLimits()` method** that:
   - Deletes all records where `reset_at` is in the past
   - Keeps the database clean and prevents unbounded growth
   - Should be called periodically (e.g., via cron job or scheduled task)

## Why This Approach

- **Database-backed storage** ensures rate limits persist across server restarts, unlike in-memory solutions
- **Atomic operations** (Prisma's `increment` and `upsert`) prevent race conditions when multiple requests arrive simultaneously
- **Separation of concerns**: The service focuses purely on rate limit logic, while the guard (to be implemented) handles HTTP-specific concerns
- **Flexible configuration**: Accepts `maxRequests` and `windowMs` as parameters, allowing different limits for different endpoints
- **Graceful degradation**: If a record doesn't exist or is expired, the system allows the request rather than failing closed

## Alternatives Considered

- **Option 1: In-memory rate limiting** (e.g., using `@nestjs/throttler` alone)
  - Pros: Faster, no database queries
  - Cons: Loses state on restart, doesn't work with multiple server instances
  - Rejected because we need persistence and potential horizontal scaling

- **Option 2: Redis-backed rate limiting**
  - Pros: Very fast, supports distributed systems, built-in TTL
  - Cons: Adds another infrastructure dependency, more complex setup
  - Deferred: Good future enhancement, but PostgreSQL is sufficient for current scale

- **Option 3: Middleware-based rate limiting**
  - Pros: Runs before route handlers
  - Cons: Less flexible, harder to apply different limits per endpoint
  - Rejected in favor of guard-based approach for better control

## Key Concepts

- **Rate Limiting Window**: A fixed time period (e.g., 60 seconds) during which requests are counted
- **Sliding vs Fixed Window**: This implementation uses a fixed window that resets at `reset_at`
- **Atomic Operations**: Database operations that complete fully or not at all, preventing partial updates
- **Upsert Pattern**: "Update or Insert" - updates if record exists, creates if it doesn't
- **IP-based Tracking**: Uses client IP address as the identifier (extracted from headers by the guard)
- **Retry-After Header**: HTTP standard for telling clients when they can retry (RFC 6585)

## Potential Pitfalls

- **IP Extraction**: The service receives IP as a string, but the guard must correctly extract it from `x-forwarded-for` or `x-real-ip` headers (especially behind proxies/load balancers)
- **Clock Skew**: If server time changes, rate limits might behave unexpectedly
- **Database Performance**: High traffic could create database bottlenecks; consider adding Redis later for caching
- **Cleanup Timing**: If `cleanupExpiredLimits()` isn't called regularly, the table will grow indefinitely
- **Race Conditions**: While Prisma's atomic operations help, the check-then-increment pattern has a small window where multiple requests could slip through (acceptable trade-off for simplicity)
- **IPv6 Addresses**: The `ip` field is `VARCHAR(45)` which accommodates IPv6, but ensure your proxy/load balancer passes the full address

## What You Learned

- **Database-backed rate limiting** provides persistence and works across server restarts
- **Prisma's atomic operations** (`increment`, `upsert`) enable safe concurrent updates
- **Service layer separation** keeps business logic independent of HTTP concerns
- **Time-based windows** require careful handling of timestamps and expiration logic
- **Graceful handling** of edge cases (missing records, expired windows) improves reliability
- **The `upsert` pattern** is powerful for "create if not exists, update if exists" scenarios
- **Cleanup strategies** are essential for time-based data to prevent database bloat

