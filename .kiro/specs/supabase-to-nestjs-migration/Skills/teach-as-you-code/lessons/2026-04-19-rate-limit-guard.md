# Lesson: Rate Limit Guard - Protecting API Endpoints

## Task Context

- Goal: Create a NestJS guard that enforces rate limiting on POST endpoints to prevent abuse
- Scope: Implement `RateLimitGuard` that extracts client IP, checks rate limits, and blocks excessive requests
- Constraints: Must support different rate limits per endpoint (/love-notes: 5 req/60s, /comments: 10 req/60s)

## Step-by-Step Changes

1. **Created `rate-limit.guard.ts`** implementing the `CanActivate` interface
   - Guards in NestJS are classes that determine whether a request should be processed
   - They run before the route handler and can block requests by returning false or throwing exceptions

2. **Implemented IP extraction logic** in `extractIp()` method
   - Checks `x-forwarded-for` header first (used by proxies and load balancers)
   - Falls back to `x-real-ip` header
   - Returns 'unknown' if neither header is present
   - Handles comma-separated IP lists by taking the first IP

3. **Implemented path-based rate limit configuration** in `getRateLimitConfig()`
   - Checks if path contains 'comments' → 10 requests per 60 seconds
   - Otherwise defaults to love-notes limit → 5 requests per 60 seconds
   - Returns configuration object with `maxRequests` and `windowMs`

4. **Implemented the main guard logic** in `canActivate()`
   - Extracts IP from request headers
   - Gets rate limit config based on request path
   - Calls `rateLimitService.checkRateLimit()` to check if request is allowed
   - If blocked: sets `Retry-After` header and throws 429 HTTP exception
   - If allowed: queries the database to check if a record exists and is active
   - If no record or expired: calls `resetRateLimit()` to create/reset with count=1
   - If active record: calls `incrementCount()` to increment the count
   - Returns true to allow the request to proceed

5. **Injected PrismaService** alongside RateLimitService
   - Needed to query the rate limit record to determine whether to reset or increment
   - This is necessary because the service methods don't provide enough information
   - The guard checks the record state before deciding which service method to call

## Why This Approach

- **Guards are the right abstraction**: NestJS guards are specifically designed for authorization and access control logic, making them perfect for rate limiting
- **Database-backed persistence**: By using the rate limit service with database storage, limits persist across server restarts
- **Path-based configuration**: Different endpoints have different abuse patterns, so flexible configuration is essential
- **Header-based IP extraction**: In production, apps often run behind proxies/load balancers, so we must check forwarding headers
- **Explicit record checking**: The guard queries the database to determine whether to reset or increment, ensuring correct behavior for all cases (new, expired, and active records)
- **Separation of concerns**: The guard handles request interception and decision logic, while the service handles database operations

## Alternatives Considered

- **Option 1: In-memory rate limiting with @nestjs/throttler**
  - Pros: Simpler, built-in package, no database queries
  - Cons: Doesn't persist across restarts, doesn't work with multiple server instances
  - Why not chosen: Requirements specify database-backed rate limiting for persistence

- **Option 2: Middleware instead of guard**
  - Pros: Runs earlier in the request lifecycle
  - Cons: Less idiomatic for NestJS, harder to apply selectively to specific routes
  - Why not chosen: Guards integrate better with NestJS decorators and dependency injection

- **Option 3: Decorator-based configuration**
  - Pros: Could specify rate limits directly on controller methods with `@RateLimit(5, 60000)`
  - Cons: More complex implementation, overkill for just two different limits
  - Why not chosen: Simple path-based logic is sufficient for current requirements

## Key Concepts

- **NestJS Guards**: Classes implementing `CanActivate` that control whether a request proceeds to the route handler
- **ExecutionContext**: Provides access to the current request/response objects in a framework-agnostic way
- **IP Forwarding Headers**: `x-forwarded-for` and `x-real-ip` are standard headers set by proxies to preserve the original client IP
- **HTTP 429 Status**: "Too Many Requests" is the standard status code for rate limiting
- **Retry-After Header**: Tells clients how many seconds to wait before retrying
- **Dependency Injection**: The guard receives `RateLimitService` through constructor injection

## Potential Pitfalls

- **IP spoofing**: If the app is directly exposed to the internet without a trusted proxy, clients could fake the `x-forwarded-for` header
  - Solution: Only trust forwarding headers when behind a known proxy/load balancer
  
- **Shared IPs**: Multiple users behind the same NAT or corporate proxy share an IP
  - Impact: Legitimate users might hit rate limits due to others' activity
  - Mitigation: Consider adding user-based rate limiting in the future (requires authentication)

- **Race conditions**: Multiple simultaneous requests from the same IP could bypass limits
  - Current approach: Check then increment is not fully atomic
  - Future improvement: Use database transactions or atomic increment operations

- **Database load**: Every rate-limited request requires 1-2 database queries
  - Impact: Could become a bottleneck under high traffic
  - Mitigation: Consider adding Redis caching layer in the future

- **Path matching logic**: Simple string matching with `path.includes('comments')` could match unintended routes
  - Example: A route like `/api/comments-archive` would get the comments rate limit
  - Solution: Use more precise path matching if more routes are added

## What You Learned

- **Guards are powerful**: They provide a clean, reusable way to implement cross-cutting concerns like rate limiting
- **Production considerations matter**: IP extraction logic must account for proxies and load balancers
- **Rate limiting is stateful**: Unlike validation, rate limiting requires persistent state across requests
- **HTTP standards exist for a reason**: Using standard status codes (429) and headers (Retry-After) ensures clients can handle rate limiting properly
- **Trade-offs are everywhere**: Database-backed rate limiting provides persistence but adds latency compared to in-memory solutions

