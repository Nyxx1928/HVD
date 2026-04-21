# Lesson: Creating a Global HTTP Exception Filter

## Task Context

- **Goal:** Create a global exception filter that standardizes all error responses across the NestJS API
- **Scope:** Implement `@Catch(HttpException)` decorator, format error responses with consistent structure, handle validation errors from class-validator, and register the filter globally
- **Constraints:** Must match the error format specified in the design document: `{ error, statusCode, timestamp, path }`

## Step-by-Step Changes

1. **Created the filter file** at `backend/src/common/filters/http-exception.filter.ts`
   - Imported necessary NestJS decorators and types
   - Created a class implementing the `ExceptionFilter` interface
   - Applied the `@Catch(HttpException)` decorator to catch all HTTP exceptions

2. **Implemented error message extraction logic**
   - Handled string error messages (simple cases)
   - Handled object error responses (complex cases)
   - Special handling for validation errors from class-validator (which come as arrays)
   - Fallback to "Internal server error" for unexpected formats

3. **Formatted the standardized error response**
   - Created an object with four fields: `error`, `statusCode`, `timestamp`, `path`
   - Used `new Date().toISOString()` for consistent timestamp format
   - Extracted the request path from the Express request object

4. **Registered the filter globally** in `backend/src/main.ts`
   - Imported the `HttpExceptionFilter` class
   - Called `app.useGlobalFilters(new HttpExceptionFilter())` during bootstrap
   - Placed it after CORS and validation pipe setup

## Why This Approach

**Centralized Error Handling:** By using a global exception filter, we ensure that all HTTP exceptions throughout the application are formatted consistently. This means whether an error comes from a controller, service, guard, or pipe, the client always receives the same error structure.

**Validation Error Support:** The filter specifically handles validation errors from class-validator, which return arrays of error messages. By joining these messages, we provide clear feedback when multiple validation rules fail.

**Request Context:** Including the request path and timestamp in the error response helps with debugging and logging. Clients can report exactly which endpoint failed and when.

**Type Safety:** Using TypeScript types from Express (`Request`, `Response`) and NestJS (`ArgumentsHost`) ensures we're accessing the correct properties and methods.

## Alternatives Considered

- **Option 1: Per-Controller Filters** - We could apply `@UseFilters()` decorator to each controller individually. This would give more granular control but would require repetitive code and could lead to inconsistent error handling if we forget to apply it somewhere.

- **Option 2: Custom Exception Classes** - We could create custom exception classes (e.g., `ValidationException`, `NotFoundError`) and catch each type separately. This would allow different formatting for different error types, but the requirements specify a single consistent format.

- **Option 3: Middleware Instead of Filter** - We could use middleware to catch errors, but NestJS exception filters are specifically designed for this purpose and integrate better with the framework's exception handling system.

## Key Concepts

**Exception Filters in NestJS:** Exception filters are responsible for processing all unhandled exceptions across an application. They implement the `ExceptionFilter` interface and use the `@Catch()` decorator to specify which exceptions to handle.

**ArgumentsHost:** This is a NestJS utility that provides access to the execution context. We use `host.switchToHttp()` to get HTTP-specific context (request and response objects) because our application is an HTTP server.

**HttpException Response Structure:** When NestJS throws an `HttpException`, the response can be either a string or an object. The object format typically includes a `message` field (which can be a string or array) and sometimes an `error` field.

**Global vs Local Filters:** Global filters apply to every route in the application, while local filters (using `@UseFilters()`) apply only to specific controllers or routes. Global filters are registered in `main.ts` using `app.useGlobalFilters()`.

**Validation Pipe Integration:** The `ValidationPipe` we configured earlier throws `BadRequestException` (a type of `HttpException`) when validation fails. Our filter catches these and formats them consistently.

## Potential Pitfalls

**Order of Global Filters Matters:** If you register multiple global filters, they execute in the order they're registered. Make sure the HTTP exception filter is registered after other setup but before the application starts listening.

**Non-HTTP Exceptions:** This filter only catches `HttpException` and its subclasses. If your code throws a plain JavaScript `Error`, it won't be caught by this filter. You'd need a separate filter with `@Catch()` (no arguments) to catch all exceptions.

**Validation Error Format Assumptions:** We assume validation errors come as an array in `responseObj.message`. If class-validator's format changes or you use a different validation library, you'll need to update the extraction logic.

**Circular JSON Issues:** If the exception response contains circular references, `JSON.stringify()` (called implicitly by `response.json()`) will fail. Our current implementation doesn't handle this edge case.

**Missing Express Types:** Make sure you have `@types/express` installed as a dev dependency, otherwise TypeScript won't recognize the `Request` and `Response` types.

## What You Learned

You learned how to create a global exception filter in NestJS that:
- Catches all HTTP exceptions using the `@Catch(HttpException)` decorator
- Extracts error messages from various response formats, including validation error arrays
- Formats errors consistently with `error`, `statusCode`, `timestamp`, and `path` fields
- Integrates with NestJS's validation system to handle class-validator errors
- Gets registered globally in `main.ts` to apply across the entire application

This pattern is essential for production APIs because it ensures clients receive predictable error responses, makes debugging easier with timestamps and paths, and centralizes error handling logic in one place.
