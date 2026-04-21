# Lesson: Creating a Production-Ready Dockerfile for NestJS Backend

## Task Context

- Goal: Create a Dockerfile that builds and runs the NestJS backend in a containerized environment with automatic database migrations
- Scope: Multi-stage Docker build that optimizes image size, runs Prisma migrations on startup, and exposes the API on port 3001
- Constraints: Must run migrations before starting the server, use Node 20 Alpine for minimal image size, and generate Prisma Client in production stage

## Step-by-Step Changes

1. **Build Stage (Stage 1)**
   - Start with `node:20-alpine` as the base image for minimal size
   - Set working directory to `/app`
   - Copy `package*.json` and `prisma/` directory first (for Docker layer caching)
   - Run `npm ci` to install all dependencies (including dev dependencies needed for build)
   - Copy all source code
   - Generate Prisma Client with `npx prisma generate`
   - Build the TypeScript application with `npm run build`

2. **Production Stage (Stage 2)**
   - Start fresh with `node:20-alpine` to avoid carrying build artifacts
   - Set working directory to `/app`
   - Copy `package*.json` and `prisma/` directory
   - Run `npm ci --only=production` to install only production dependencies
   - Copy the built `dist/` folder from the builder stage
   - Generate Prisma Client again in production stage (required for runtime)
   - Expose port 3001 for the API
   - Set CMD to run migrations then start: `sh -c "npx prisma migrate deploy && node dist/main"`

3. **Key Changes from Original**
   - Removed copying `.prisma` from builder stage (we regenerate it in production)
   - Changed CMD from `npm run start:prod` to direct migration + start command
   - Added explicit `npx prisma generate` in production stage

## Why This Approach

**Multi-Stage Build**: Separating build and production stages keeps the final image small. The builder stage includes dev dependencies and source code, but the production stage only includes compiled code and runtime dependencies.

**Running Migrations on Startup**: Using `npx prisma migrate deploy && node dist/main` ensures the database schema is always up-to-date before the application starts. This is critical for production deployments where the database might be behind the code version.

**Regenerating Prisma Client**: We generate the Prisma Client in both stages because:
- Build stage needs it to compile TypeScript (types)
- Production stage needs it at runtime (actual database client)
- Copying `.prisma` from builder can cause issues with different architectures or Node versions

**Alpine Linux**: Using `node:20-alpine` instead of the full Node image reduces the final image size from ~1GB to ~200MB, improving deployment speed and reducing storage costs.

**Shell Wrapper for CMD**: Using `sh -c` allows us to chain commands with `&&`, ensuring migrations complete successfully before starting the server.

## Alternatives Considered

**Option 1: Run migrations in a separate init container**
- Pros: Cleaner separation of concerns, migrations run once per deployment
- Cons: More complex orchestration, requires Kubernetes or similar
- Why not chosen: Simpler to run migrations on app startup for this use case

**Option 2: Use npm scripts for the CMD**
- Example: `CMD ["npm", "run", "start:prod"]` with a custom script
- Pros: Keeps Docker commands simple
- Cons: Requires modifying package.json, less transparent what's happening
- Why not chosen: Direct commands are more explicit and don't require package.json changes

**Option 3: Copy Prisma Client from builder stage**
- Example: `COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma`
- Pros: Slightly faster build (no regeneration)
- Cons: Can break with architecture mismatches, less reliable
- Why not chosen: Regenerating is safer and only adds a few seconds to build time

**Option 4: Use a full Node image instead of Alpine**
- Pros: More compatible with native dependencies
- Cons: Much larger image size (5x bigger)
- Why not chosen: Alpine works fine for this application and saves significant space

## Key Concepts

**Docker Multi-Stage Builds**: A technique where you use multiple `FROM` statements in a Dockerfile. Each stage can copy artifacts from previous stages using `COPY --from=<stage-name>`. This allows you to have a heavy build environment and a lean production environment.

**Layer Caching**: Docker caches each instruction as a layer. By copying `package*.json` before source code, we ensure that `npm ci` only re-runs when dependencies change, not when code changes. This dramatically speeds up rebuilds.

**Prisma Client Generation**: Prisma generates TypeScript types and a database client based on your schema. This must happen after `npm install` (which installs the Prisma CLI) and before building/running the app.

**Database Migrations**: Prisma migrations are SQL files that modify your database schema. `prisma migrate deploy` applies any pending migrations, ensuring the database structure matches your Prisma schema.

**CMD vs ENTRYPOINT**: `CMD` provides default arguments that can be overridden when running the container. `ENTRYPOINT` sets the main command that always runs. We use `CMD` here for flexibility.

**Shell Form vs Exec Form**: 
- Exec form: `CMD ["node", "dist/main"]` - runs directly, no shell
- Shell form: `CMD node dist/main` - runs in a shell
- We use exec form with `sh -c` to get both benefits: direct execution with shell features like `&&`

## Potential Pitfalls

**Migration Failures**: If `prisma migrate deploy` fails, the container will exit. This is intentional - you don't want the app running with an outdated schema. Check logs to diagnose migration issues.

**Missing Environment Variables**: The container needs `DATABASE_URL` to run migrations and connect to the database. Ensure this is set in your docker-compose.yml or deployment environment.

**Port Conflicts**: Port 3001 must be available on the host. If you're running multiple services, ensure they use different ports or use Docker networks.

**Prisma Client Platform Mismatch**: If you build on Mac/Windows but deploy to Linux, Prisma Client might not work. Always build Docker images on the target platform or use multi-platform builds.

**Long Startup Time**: Running migrations on every container start adds time. For large migration sets, consider running migrations separately in CI/CD before deploying new containers.

**Database Connection During Build**: The Dockerfile doesn't need database access during build (only at runtime). If you see connection errors during `docker build`, something is wrong with your setup.

**npm ci vs npm install**: `npm ci` is faster and more reliable for production because it installs exact versions from package-lock.json and removes node_modules first. Always use `npm ci` in Docker.

## What You Learned

You learned how to create a production-ready Dockerfile for a NestJS application with:
- Multi-stage builds to minimize image size
- Proper layer caching for fast rebuilds
- Automatic database migrations on startup
- Prisma Client generation in the production environment
- Best practices for Node.js containerization

This Dockerfile pattern can be reused for any NestJS + Prisma application. The key insight is that migrations should run before the app starts, ensuring database and code are always in sync.
