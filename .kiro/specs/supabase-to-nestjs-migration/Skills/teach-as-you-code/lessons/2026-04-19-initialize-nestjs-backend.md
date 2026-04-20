# Lesson: Initialize NestJS Backend Project Structure

## Task Context

- **Goal**: Set up a new NestJS backend application from scratch to replace Supabase
- **Scope**: Create project structure, install dependencies, configure TypeScript, set up CORS, and create basic entry point files
- **Constraints**: Must support TypeScript, Prisma ORM, class-validator for validation, and allow CORS requests from the Next.js frontend

## Step-by-Step Changes

### 1. Created Project Configuration Files

**package.json**: Defined all project dependencies and scripts
- Core NestJS packages: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
- Prisma packages: `@prisma/client` (runtime) and `prisma` (CLI, dev dependency)
- Validation packages: `class-validator` and `class-transformer` for DTO validation
- Testing packages: Jest, Supertest for unit and integration tests
- Build tools: TypeScript, ESLint, Prettier for code quality

**tsconfig.json**: Configured TypeScript compiler options
- Target: ES2021 for modern JavaScript features
- Module: CommonJS (Node.js standard)
- Enabled decorators: Required for NestJS dependency injection and metadata
- Output directory: `./dist` for compiled JavaScript

**nest-cli.json**: NestJS CLI configuration
- Source root: `src` directory
- Compiler options: Delete output directory before each build

### 2. Created Application Entry Point (main.ts)

This is where the NestJS application starts:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Strip unknown properties
    transform: true,        // Auto-transform payloads to DTO types
    forbidNonWhitelisted: true,  // Throw error on unknown properties
  }));
  
  await app.listen(port);
}
```

**Key features configured**:
- **CORS**: Allows the Next.js frontend (running on port 3000) to make requests to the backend (port 3001)
- **Global Validation Pipe**: Automatically validates all incoming requests against DTO classes using class-validator decorators

### 3. Created Root Module (app.module.ts)

The root module is the entry point for NestJS's dependency injection system:

```typescript
@Module({
  imports: [],           // Other modules will be imported here
  controllers: [AppController],  // HTTP route handlers
  providers: [AppService],       // Injectable services
})
export class AppModule {}
```

This follows NestJS's modular architecture where features are organized into modules.

### 4. Created Basic Controller and Service

**AppController**: Handles HTTP requests
- `@Controller()` decorator marks it as a controller
- `@Get()` decorator creates a GET route at the root path `/`

**AppService**: Contains business logic
- `@Injectable()` decorator allows it to be injected into controllers
- Returns a simple welcome message

### 5. Set Up Development Tools

**ESLint (.eslintrc.js)**: Code linting rules
- TypeScript-specific rules
- Prettier integration for consistent formatting

**Prettier (.prettierrc)**: Code formatting
- Single quotes for strings
- Trailing commas in objects/arrays

**Jest (package.json)**: Testing framework
- Unit tests: `*.spec.ts` files
- E2E tests: `test/*.e2e-spec.ts` files

### 6. Created Environment Configuration

**.env.example**: Template for environment variables
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default 3001)
- `CORS_ORIGIN`: Frontend URL for CORS
- Rate limiting configuration (for future tasks)

**.gitignore**: Prevents committing sensitive/generated files
- `node_modules/`, `dist/`, `.env`
- IDE-specific files
- Prisma migration files (except .gitkeep)

### 7. Created Documentation

**README.md**: Comprehensive setup guide
- Prerequisites and technology stack
- Step-by-step local development setup
- Available npm scripts
- Project structure overview
- Environment variables reference

## Why This Approach

### Manual Project Setup vs NestJS CLI

We created the project structure manually instead of using `nest new` because:
1. **Learning**: Understanding each file's purpose builds deeper knowledge
2. **Control**: We can customize the structure from the start
3. **Transparency**: Every file is explicitly created and explained
4. **Flexibility**: Easy to adapt to specific project needs

### Global Validation Pipe

Applying validation globally in `main.ts` ensures:
- **Consistency**: All endpoints automatically validate requests
- **Security**: Invalid data is rejected before reaching business logic
- **DRY Principle**: No need to add validation pipe to each controller
- **Type Safety**: DTOs are automatically transformed to their class types

### CORS Configuration

CORS is essential because:
- Frontend (Next.js on port 3000) and backend (NestJS on port 3001) are on different origins
- Browsers block cross-origin requests by default for security
- We explicitly allow the frontend origin to make requests
- `credentials: true` allows cookies/auth headers (for future authentication)

### Environment-Based Configuration

Using environment variables for configuration:
- **Security**: Sensitive data (database passwords) not in code
- **Flexibility**: Different settings for dev/staging/production
- **12-Factor App**: Follows best practices for cloud-native applications

## Alternatives Considered

### Alternative 1: Use NestJS CLI (`nest new`)

**Pros**:
- Faster initial setup
- Generates standard NestJS structure
- Includes all boilerplate automatically

**Cons**:
- Less educational (files appear "magically")
- May include unnecessary files
- Harder to customize during creation

**Decision**: Manual setup for better learning experience

### Alternative 2: Express.js Instead of NestJS

**Pros**:
- Simpler, more lightweight
- More flexible (less opinionated)
- Larger ecosystem

**Cons**:
- No built-in structure (need to create your own)
- No dependency injection out of the box
- More boilerplate for validation, error handling
- Less TypeScript-first

**Decision**: NestJS provides better structure for learning backend architecture

### Alternative 3: Fastify Platform Instead of Express

NestJS supports Fastify as an alternative to Express:

**Pros**:
- Faster performance
- Better TypeScript support
- Built-in schema validation

**Cons**:
- Smaller ecosystem
- Less familiar to most developers
- Some middleware incompatibilities

**Decision**: Express is the default and more widely used, better for learning

## Key Concepts

### 1. Dependency Injection (DI)

NestJS uses DI to manage class dependencies:
```typescript
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  // NestJS automatically provides AppService instance
}
```

**Benefits**:
- Loose coupling between classes
- Easy to test (can inject mocks)
- Automatic lifecycle management

### 2. Decorators

TypeScript decorators add metadata to classes and methods:
- `@Module()`: Defines a module
- `@Controller()`: Marks a class as a controller
- `@Injectable()`: Marks a class as a provider
- `@Get()`, `@Post()`: Define HTTP routes

Decorators are the foundation of NestJS's declarative programming style.

### 3. Modules

Modules organize code into cohesive blocks:
- Each feature gets its own module (e.g., LoveNotesModule, CommentsModule)
- Modules can import other modules
- Root module (AppModule) ties everything together

This promotes separation of concerns and reusability.

### 4. Validation Pipe

The ValidationPipe uses class-validator decorators to validate DTOs:
```typescript
export class CreateNoteDto {
  @IsString()
  @MaxLength(36)
  name: string;
}
```

When a request comes in, the pipe:
1. Transforms plain JSON to DTO class instance
2. Validates against decorators
3. Returns 400 error if validation fails
4. Passes validated DTO to controller if successful

### 5. CORS (Cross-Origin Resource Sharing)

CORS is a security mechanism:
- Browsers block requests from one origin to another by default
- Server must explicitly allow cross-origin requests
- We configure which origins, methods, and headers are allowed

Without CORS, the frontend couldn't call the backend API.

## Potential Pitfalls

### 1. Forgetting to Enable CORS

**Symptom**: Frontend requests fail with CORS errors in browser console

**Solution**: Always configure CORS in `main.ts` when frontend and backend are on different ports/domains

### 2. Missing Environment Variables

**Symptom**: Application crashes on startup with "undefined" errors

**Solution**: 
- Always create `.env` file from `.env.example`
- Use default values in code: `process.env.PORT || 3001`
- Validate required env vars on startup

### 3. Not Applying ValidationPipe Globally

**Symptom**: DTOs don't validate, invalid data reaches controllers

**Solution**: Apply `app.useGlobalPipes(new ValidationPipe())` in `main.ts`

### 4. Incorrect TypeScript Configuration

**Symptom**: Decorators don't work, compilation errors

**Solution**: Ensure these are enabled in `tsconfig.json`:
```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

### 5. Port Already in Use

**Symptom**: Error "EADDRINUSE" when starting the server

**Solution**: 
- Check if another process is using port 3001
- Change PORT in `.env` file
- Kill the process using the port

### 6. Module Import Order

**Symptom**: Circular dependency errors, providers not found

**Solution**: 
- Import shared modules (like PrismaModule) before feature modules
- Use `forwardRef()` for circular dependencies (rare)
- Keep module dependencies unidirectional

## What You Learned

### Technical Skills

1. **NestJS Project Structure**: How to organize a NestJS application with proper separation of concerns
2. **TypeScript Configuration**: Setting up TypeScript for Node.js with decorators and modern features
3. **Dependency Management**: Using npm to manage project dependencies and scripts
4. **CORS Configuration**: Enabling cross-origin requests for frontend-backend communication
5. **Global Validation**: Applying validation pipes globally for consistent request validation
6. **Environment Configuration**: Using environment variables for flexible configuration

### Backend Architecture Concepts

1. **Modular Architecture**: Organizing code into modules for maintainability
2. **Dependency Injection**: How NestJS manages class dependencies automatically
3. **Decorators**: Using TypeScript decorators for declarative programming
4. **Separation of Concerns**: Controllers handle HTTP, services handle business logic
5. **Configuration Management**: Separating configuration from code

### Best Practices

1. **Documentation**: Creating comprehensive README for future developers
2. **Code Quality Tools**: Setting up ESLint and Prettier from the start
3. **Testing Setup**: Configuring Jest for unit and E2E tests early
4. **Git Hygiene**: Using .gitignore to prevent committing sensitive files
5. **Environment Templates**: Providing .env.example for easy setup

### Next Steps

You now have a solid foundation for the NestJS backend. The next tasks will build on this:
- **Task 2**: Set up Prisma and define the database schema
- **Task 3**: Implement the Love Notes module with CRUD operations
- **Task 4**: Implement the Comments module
- **Task 5**: Add database-backed rate limiting

Each task will add new modules to the application, following the same patterns established here.
