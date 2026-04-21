# Lesson: Building a Health Check Endpoint for Monitoring

## Task Context

- Goal: Create a `/health` endpoint that returns the application status and database connectivity
- Scope: Create a new HealthController and HealthModule, test database connection using Prisma
- Constraints: Must return specific format: `{ status: 'ok', timestamp, database: 'connected' }`

## Step-by-Step Changes

1. **Created `backend/src/health/health.controller.ts`**
   - Defined a `HealthController` with a single `@Get()` endpoint
   - Injected `PrismaService` to test database connectivity
   - Used `$queryRaw` to execute a simple `SELECT 1` query to verify the database is reachable
   - Wrapped the database test in a try-catch to handle connection failures gracefully
   - Returned a JSON object with `status`, `timestamp`, and `database` fields

2. **Created `backend/src/health/health.module.ts`**
   - Defined a `HealthModule` that imports `PrismaModule` (for database access)
   - Registered the `HealthController` in the module's controllers array
   - This makes the health endpoint available at `/health`

3. **Updated `backend/src/app.module.ts`**
   - Added `HealthModule` to the imports array in `AppModule`
   - This registers the health endpoint with the NestJS application

4. **Tested the endpoint**
   - Started the backend server with `npm run start:dev`
   - Made a request to `http://localhost:3001/health`
   - Verified the response: `{"status":"ok","timestamp":"2026-04-20T12:54:14.750Z","database":"connected"}`

## Why This Approach

**Health checks are critical for production deployments** because they allow:
- Load balancers to detect if an instance is healthy and route traffic accordingly
- Container orchestrators (like Docker Swarm or Kubernetes) to restart unhealthy containers
- Monitoring systems to alert when services go down
- Deployment systems to verify that a new version started successfully

**Testing the database connection** is important because:
- The application depends on the database to function
- A running server with a broken database connection is worse than a stopped server (it will return errors to users)
- Using `$queryRaw` with a simple query (`SELECT 1`) is lightweight and doesn't affect application data

**Returning 'connected' vs 'disconnected'** instead of throwing an error:
- The health endpoint itself should always return 200 OK (the endpoint is working)
- The response body indicates whether dependencies (like the database) are healthy
- This allows monitoring systems to distinguish between "service is down" vs "service is up but database is down"

## Alternatives Considered

**Option 1: Use NestJS Terminus library**
- NestJS provides a `@nestjs/terminus` package specifically for health checks
- Pros: More features (memory checks, disk checks, HTTP checks), standardized format
- Cons: Additional dependency, more complex setup for a simple use case
- Decision: We chose a simple custom implementation because we only need database connectivity checks

**Option 2: Return HTTP 503 when database is disconnected**
- Could return a 503 Service Unavailable status when the database is down
- Pros: More semantically correct HTTP status
- Cons: Some load balancers might remove the instance from rotation even if it's just a temporary blip
- Decision: We return 200 with status in the body to give more control to monitoring systems

**Option 3: Use Prisma's `$connect()` method**
- Could call `await this.prisma.$connect()` to test the connection
- Pros: More explicit connection test
- Cons: `$connect()` is already called in `onModuleInit`, and calling it again doesn't verify the connection is still active
- Decision: `$queryRaw` actually executes a query, which is a better test of database health

## Key Concepts

**Health Check Endpoints**
- A health check is a simple endpoint that returns the status of a service
- Used by infrastructure tools to monitor service health
- Should be fast (< 1 second) and lightweight
- Should test critical dependencies (database, external APIs, etc.)

**Prisma $queryRaw**
- `$queryRaw` allows you to execute raw SQL queries
- Returns a promise that resolves with the query results
- Useful for database-specific operations or testing connectivity
- The backtick syntax (`` $queryRaw`SELECT 1` ``) is a tagged template literal that safely escapes parameters

**NestJS Module Organization**
- Each feature gets its own module (HealthModule, LoveNotesModule, etc.)
- Modules import other modules to access their services (HealthModule imports PrismaModule)
- The root AppModule imports all feature modules to wire up the application

**Dependency Injection**
- The `constructor(private readonly prisma: PrismaService)` syntax injects the PrismaService
- NestJS automatically provides the service instance when creating the controller
- This makes testing easier (you can inject a mock service) and follows SOLID principles

## Potential Pitfalls

**Pitfall 1: Not handling database errors**
- If you don't wrap the `$queryRaw` call in try-catch, an error will crash the endpoint
- Solution: Always catch database errors and return a 'disconnected' status

**Pitfall 2: Slow health checks**
- If the database query takes too long, the health check will timeout
- Solution: Use a simple, fast query like `SELECT 1` instead of complex queries

**Pitfall 3: Forgetting to import PrismaModule**
- If you don't import PrismaModule in HealthModule, NestJS can't inject PrismaService
- Error: "Nest can't resolve dependencies of the HealthController"
- Solution: Always import the module that provides the service you need

**Pitfall 4: Not registering the module in AppModule**
- If you don't add HealthModule to AppModule's imports, the endpoint won't be available
- Solution: Always register feature modules in the root AppModule

**Pitfall 5: Using complex queries for health checks**
- Don't query actual application data (like counting love notes) in health checks
- This adds unnecessary load and can slow down the health check
- Solution: Use a simple query that just tests connectivity

## What You Learned

In this lesson, you learned how to:

1. **Create a health check endpoint** that monitors application and database status
2. **Test database connectivity** using Prisma's `$queryRaw` method
3. **Handle errors gracefully** by catching exceptions and returning status information
4. **Organize code into modules** following NestJS best practices
5. **Use dependency injection** to access services from other modules

You also learned why health checks are important for production deployments and how they help with monitoring, load balancing, and automated recovery.

The health endpoint you built is now ready to be used by Docker health checks, load balancers, and monitoring systems to ensure your application is running correctly!
