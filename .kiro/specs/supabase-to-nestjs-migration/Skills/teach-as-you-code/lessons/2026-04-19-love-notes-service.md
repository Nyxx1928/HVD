# Lesson: Implement Love Notes Service

## Task Context

- **Goal**: Create the service layer that handles business logic and database operations for love notes
- **Scope**: Implement `findAll()` to retrieve notes and `create()` to insert new notes with proper defaults
- **Constraints**: Must use PrismaService for database access, limit results to 100 notes, apply default emoji (💗) and color (rose), and handle database errors appropriately

## Step-by-Step Changes

### 1. Created the Love Notes Service File

Created `backend/src/love-notes/love-notes.service.ts` with the `@Injectable()` decorator to make it available for dependency injection.

### 2. Injected PrismaService Dependency

```typescript
constructor(private readonly prisma: PrismaService) {}
```

**Why this works**:
- NestJS's dependency injection automatically provides the PrismaService instance
- `private readonly` creates a class property and assigns the injected value
- We can now use `this.prisma` to access the database throughout the service

### 3. Implemented findAll() Method

```typescript
async findAll(): Promise<LoveNote[]> {
  try {
    return await this.prisma.loveNote.findMany({
      take: 100,
      orderBy: {
        created_at: 'desc',
      },
    });
  } catch (error) {
    throw new InternalServerErrorException(
      'Failed to retrieve love notes',
    );
  }
}
```

**Key features**:
- **take: 100**: Limits results to 100 notes maximum (requirement 3.1)
- **orderBy created_at desc**: Returns newest notes first
- **Error handling**: Wraps database errors in NestJS's InternalServerErrorException
- **Return type**: Promise<LoveNote[]> uses Prisma's generated type for type safety

### 4. Implemented create() Method

```typescript
async create(data: CreateLoveNoteDto): Promise<LoveNote> {
  try {
    return await this.prisma.loveNote.create({
      data: {
        name: data.name,
        message: data.message,
        emoji: data.emoji || '💗',
        color: data.color || 'rose',
      },
    });
  } catch (error) {
    throw new InternalServerErrorException(
      'Failed to create love note',
    );
  }
}
```

**Key features**:
- **Default values**: Uses `||` operator to apply defaults when emoji/color are undefined (requirement 3.6)
- **Explicit field mapping**: Maps DTO fields to database fields clearly
- **Error handling**: Catches and wraps database errors
- **Return type**: Promise<LoveNote> returns the created note with generated ID and timestamp

### 5. Added Comprehensive Documentation

Added JSDoc comments explaining:
- What each method does
- Parameters and return types
- Exceptions that can be thrown
- Business logic (like default values)

## Why This Approach

### Service Layer Pattern

We separate database operations into a service layer because:
1. **Separation of Concerns**: Controllers handle HTTP, services handle business logic
2. **Reusability**: Services can be used by multiple controllers or other services
3. **Testability**: Services can be tested independently without HTTP layer
4. **Maintainability**: Business logic is centralized and easier to modify

### Dependency Injection for PrismaService

Instead of creating a new PrismaClient instance, we inject PrismaService:
- **Single Connection**: All services share the same database connection pool
- **Lifecycle Management**: NestJS handles connection/disconnection automatically
- **Testing**: Easy to mock PrismaService in unit tests
- **Configuration**: Database URL and settings managed centrally

### Explicit Default Values in Service

We apply defaults in the service layer (not relying solely on database defaults) because:
1. **Clarity**: Code explicitly shows what defaults are applied
2. **Consistency**: Same defaults whether using Prisma or raw SQL
3. **Validation**: Defaults are applied after DTO validation passes
4. **Flexibility**: Easy to change default logic without database migration

### Error Handling Strategy

We wrap database errors in `InternalServerErrorException` because:
- **Abstraction**: Hides database implementation details from API consumers
- **Consistency**: All errors follow NestJS's exception format
- **Security**: Doesn't leak sensitive database information
- **HTTP Mapping**: Automatically returns 500 status code

### Type Safety with Prisma

Using Prisma's generated types (`LoveNote`) provides:
- **Compile-time Checks**: TypeScript catches type mismatches before runtime
- **IntelliSense**: IDE autocomplete for database fields
- **Refactoring Safety**: Renaming fields updates all usages
- **Documentation**: Types serve as inline documentation

## Alternatives Considered

### Alternative 1: Apply Defaults in Database Schema Only

**Approach**: Rely on Prisma schema defaults without explicit service logic
```typescript
async create(data: CreateLoveNoteDto): Promise<LoveNote> {
  return await this.prisma.loveNote.create({
    data: data, // Let database apply defaults
  });
}
```

**Pros**:
- Less code in service
- Single source of truth (schema)

**Cons**:
- Less explicit (defaults are "hidden" in schema)
- Harder to apply conditional defaults
- Requires database round-trip to see defaults

**Decision**: Explicit defaults in service for clarity and flexibility

### Alternative 2: Return DTOs Instead of Prisma Types

**Approach**: Transform Prisma types to response DTOs in service
```typescript
async findAll(): Promise<LoveNoteResponseDto[]> {
  const notes = await this.prisma.loveNote.findMany(...);
  return notes.map(note => new LoveNoteResponseDto(note));
}
```

**Pros**:
- Service returns exactly what API needs
- Can hide internal fields
- Transformation logic in one place

**Cons**:
- More boilerplate code
- Less flexible (controller can't transform differently)
- Duplicates type definitions

**Decision**: Return Prisma types, let controller handle transformation (NestJS does this automatically)

### Alternative 3: No Error Handling (Let Errors Bubble)

**Approach**: Don't catch database errors, let NestJS handle them
```typescript
async findAll(): Promise<LoveNote[]> {
  return await this.prisma.loveNote.findMany(...);
}
```

**Pros**:
- Less code
- NestJS has default error handling

**Cons**:
- Exposes database error details to clients
- Less control over error messages
- Harder to add logging or custom error handling

**Decision**: Explicit error handling for better control and security

### Alternative 4: Repository Pattern

**Approach**: Create a separate repository layer between service and Prisma
```typescript
class LoveNoteRepository {
  async findAll() { ... }
  async create() { ... }
}

class LoveNotesService {
  constructor(private repo: LoveNoteRepository) {}
}
```

**Pros**:
- Additional abstraction layer
- Could swap database implementations
- Follows Domain-Driven Design

**Cons**:
- More boilerplate for simple CRUD
- Prisma already abstracts database
- Overkill for this application

**Decision**: Service directly uses Prisma for simplicity

## Key Concepts

### 1. Service Layer in MVC Architecture

```
Controller (HTTP) → Service (Business Logic) → Database
```

**Responsibilities**:
- **Controller**: Parse requests, validate input, format responses
- **Service**: Business logic, data transformation, orchestration
- **Database**: Data persistence and retrieval

Services are the "brain" of the application.

### 2. Prisma Client API

Prisma provides a type-safe database client:

**findMany()**: Query multiple records
```typescript
prisma.loveNote.findMany({
  where: { color: 'rose' },    // Filter
  take: 10,                     // Limit
  skip: 20,                     // Offset
  orderBy: { created_at: 'desc' }, // Sort
})
```

**create()**: Insert a record
```typescript
prisma.loveNote.create({
  data: {
    name: 'Alice',
    message: 'Hello!',
  },
})
```

Prisma automatically:
- Generates UUIDs for `id`
- Sets `created_at` to current timestamp
- Applies schema defaults

### 3. Async/Await for Database Operations

Database operations are asynchronous:
```typescript
async findAll(): Promise<LoveNote[]> {
  return await this.prisma.loveNote.findMany();
}
```

**Why async/await**:
- Database queries take time (network, disk I/O)
- `async` marks function as asynchronous
- `await` pauses execution until promise resolves
- Non-blocking: Node.js can handle other requests while waiting

### 4. NestJS Exception Handling

NestJS provides built-in exception classes:
- `BadRequestException` (400): Invalid input
- `NotFoundException` (404): Resource not found
- `InternalServerErrorException` (500): Server error

These automatically:
- Set correct HTTP status code
- Format error response as JSON
- Log the error

### 5. Dependency Injection Lifecycle

When a request comes in:
1. NestJS creates/reuses controller instance
2. Controller requests service from DI container
3. Service requests PrismaService from DI container
4. PrismaService is a singleton (one instance shared)
5. Service uses PrismaService to query database
6. Response flows back through the chain

## Potential Pitfalls

### 1. Forgetting to Inject PrismaService

**Symptom**: `this.prisma is undefined` error

**Wrong**:
```typescript
export class LoveNotesService {
  async findAll() {
    return await this.prisma.loveNote.findMany(); // Error!
  }
}
```

**Correct**:
```typescript
export class LoveNotesService {
  constructor(private readonly prisma: PrismaService) {}
}
```

**Solution**: Always inject dependencies through constructor

### 2. Not Handling Database Errors

**Symptom**: Prisma errors exposed to API clients with stack traces

**Wrong**:
```typescript
async findAll() {
  return await this.prisma.loveNote.findMany(); // Errors bubble up
}
```

**Correct**:
```typescript
async findAll() {
  try {
    return await this.prisma.loveNote.findMany();
  } catch (error) {
    throw new InternalServerErrorException('Failed to retrieve love notes');
  }
}
```

**Solution**: Wrap database operations in try-catch

### 3. Forgetting Default Values

**Symptom**: Notes created without emoji/color when not provided

**Wrong**:
```typescript
async create(data: CreateLoveNoteDto) {
  return await this.prisma.loveNote.create({
    data: data, // Missing defaults
  });
}
```

**Correct**:
```typescript
async create(data: CreateLoveNoteDto) {
  return await this.prisma.loveNote.create({
    data: {
      ...data,
      emoji: data.emoji || '💗',
      color: data.color || 'rose',
    },
  });
}
```

**Solution**: Explicitly apply defaults for optional fields

### 4. Incorrect Return Types

**Symptom**: TypeScript errors, type mismatches

**Wrong**:
```typescript
async findAll(): Promise<any> { // Too loose
  return await this.prisma.loveNote.findMany();
}
```

**Correct**:
```typescript
async findAll(): Promise<LoveNote[]> { // Specific type
  return await this.prisma.loveNote.findMany();
}
```

**Solution**: Use Prisma's generated types for type safety

### 5. Not Using @Injectable() Decorator

**Symptom**: "Cannot resolve dependencies" error when injecting service

**Wrong**:
```typescript
export class LoveNotesService { // Missing decorator
  constructor(private prisma: PrismaService) {}
}
```

**Correct**:
```typescript
@Injectable()
export class LoveNotesService {
  constructor(private prisma: PrismaService) {}
}
```

**Solution**: Always add @Injectable() to services

### 6. Forgetting to Register Service in Module

**Symptom**: Service not found when injecting into controller

**Solution**: Add service to module's `providers` array (covered in next task)

## What You Learned

### Technical Skills

1. **NestJS Services**: How to create injectable service classes with business logic
2. **Prisma Client API**: Using `findMany()` and `create()` for database operations
3. **Dependency Injection**: Injecting PrismaService into the service constructor
4. **Error Handling**: Wrapping database errors in NestJS exceptions
5. **Type Safety**: Using Prisma's generated types for compile-time safety
6. **Async/Await**: Handling asynchronous database operations

### Backend Architecture Concepts

1. **Service Layer Pattern**: Separating business logic from HTTP handling
2. **Single Responsibility**: Services focus on data operations, not HTTP concerns
3. **Abstraction**: Hiding database implementation details behind service methods
4. **Default Values**: Applying business rules (defaults) in the service layer
5. **Error Abstraction**: Converting database errors to HTTP-friendly exceptions

### Best Practices

1. **Documentation**: Adding JSDoc comments to explain method behavior
2. **Explicit Code**: Making defaults and logic clear rather than implicit
3. **Type Annotations**: Always specifying return types for methods
4. **Error Messages**: Providing clear, user-friendly error messages
5. **Readonly Properties**: Using `readonly` for injected dependencies

### Prisma Patterns

1. **Query Limiting**: Using `take` to limit result sets
2. **Sorting**: Using `orderBy` for consistent ordering
3. **Default Values**: Applying defaults with `||` operator
4. **Type Generation**: Leveraging Prisma's generated TypeScript types
5. **Connection Management**: Letting PrismaService handle connections

### Next Steps

The service is now ready to be used by a controller. The next tasks will:
- **Task 3.3**: Create the Love Notes controller to expose HTTP endpoints
- **Task 3.4**: Create the Love Notes module to wire everything together
- **Task 3.5**: Write unit tests to verify the service works correctly

The service layer is the foundation - controllers will delegate to these methods to handle HTTP requests.

