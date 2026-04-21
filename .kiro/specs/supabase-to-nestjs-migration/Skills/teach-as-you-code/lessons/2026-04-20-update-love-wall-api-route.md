# Lesson: Migrating Love Wall API Route from Supabase to NestJS Backend

## Task Context

- **Goal:** Replace Supabase client calls in the Next.js API route with fetch requests to the NestJS backend
- **Scope:** Update `valentines/app/api/love-wall/route.ts` to handle GET and POST requests using the new backend API
- **Constraints:** 
  - Maintain the same response format for frontend compatibility
  - Preserve error handling behavior
  - Forward IP headers for rate limiting
  - Handle all error scenarios gracefully

## Step-by-Step Changes

### 1. Removed Supabase Dependencies

**Before:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

**After:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

**What changed:** We removed the Supabase client import and replaced the Supabase environment variables with a single `NEXT_PUBLIC_API_URL` variable that points to our NestJS backend.

### 2. Simplified GET Request Handler

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('love_wall')
  .select('id,name,message,emoji,color,created_at')
  .order('created_at', { ascending: false })
  .limit(100);

if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

return NextResponse.json({ data });
```

**After (Fetch to NestJS):**
```typescript
const response = await fetch(`${API_URL}/love-notes`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

if (!response.ok) {
  const errorPayload = await response.json().catch(() => ({
    error: 'Failed to fetch love notes',
  }));
  return NextResponse.json(
    { error: errorPayload.error || 'Failed to fetch love notes' },
    { status: response.status }
  );
}

const data = await response.json();
return NextResponse.json({ data });
```

**What changed:** 
- Replaced Supabase query builder with a standard HTTP fetch call
- The backend now handles ordering, limiting, and field selection
- Error handling now parses the backend's error response format
- Added try-catch for network errors

### 3. Moved Rate Limiting to Backend

**Before:** The Next.js API route handled rate limiting by directly querying the Supabase `love_wall_rate_limits` table (60+ lines of code).

**After:** Rate limiting is now handled by the NestJS backend's `RateLimitGuard`. The Next.js route simply forwards IP headers:

```typescript
headers: {
  'Content-Type': 'application/json',
  // Forward IP headers for rate limiting
  ...(request.headers.get('x-forwarded-for') && {
    'x-forwarded-for': request.headers.get('x-forwarded-for')!,
  }),
  ...(request.headers.get('x-real-ip') && {
    'x-real-ip': request.headers.get('x-real-ip')!,
  }),
}
```

**What changed:**
- Removed all rate limiting logic from the frontend API route
- Backend now manages rate limit state in the database
- Frontend just forwards the client's IP address headers
- Reduced code complexity from ~100 lines to ~40 lines

### 4. Moved Validation to Backend

**Before:** The Next.js route validated field lengths and required fields:

```typescript
const name = payload.name?.trim();
const message = payload.message?.trim();

if (!name || !message) {
  return NextResponse.json(
    { error: 'Name and message are required.' },
    { status: 400 }
  );
}

if (name.length > 36 || message.length > 240) {
  return NextResponse.json(
    { error: 'Message is too long.' },
    { status: 400 }
  );
}
```

**After:** Validation is handled by the NestJS backend using class-validator decorators. The frontend route just forwards the payload:

```typescript
const response = await fetch(`${API_URL}/love-notes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**What changed:**
- Backend DTOs with `@IsString()`, `@MaxLength()`, etc. handle validation
- Frontend receives validation errors from backend and forwards them
- Single source of truth for validation rules

### 5. Enhanced Error Handling

**New error handling structure:**

```typescript
try {
  const response = await fetch(`${API_URL}/love-notes`, { ... });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({
      error: 'Failed to create love note',
    }));

    // Special handling for rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      return NextResponse.json(
        { error: errorPayload.error || 'Too many requests' },
        {
          status: 429,
          headers: retryAfter ? { 'Retry-After': retryAfter } : {},
        }
      );
    }

    return NextResponse.json(
      { error: errorPayload.error || 'Failed to create love note' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json({ data }, { status: 201 });
} catch (error) {
  return NextResponse.json(
    { error: 'Network error while creating love note' },
    { status: 500 }
  );
}
```

**What this handles:**
- HTTP errors (400, 404, 429, 500) from the backend
- Rate limiting with `Retry-After` header forwarding
- Network failures (backend unreachable)
- Malformed JSON responses from backend

## Why This Approach

### 1. Separation of Concerns

The Next.js API route now acts as a **thin proxy layer** between the frontend and backend:
- **Frontend components** → call Next.js API routes
- **Next.js API routes** → forward requests to NestJS backend
- **NestJS backend** → handles business logic, validation, rate limiting, database

This separation makes each layer simpler and more focused.

### 2. Backend Owns Business Logic

Moving validation and rate limiting to the backend provides:
- **Single source of truth:** Validation rules exist in one place (backend DTOs)
- **Consistency:** All clients (web, mobile, API) get the same validation
- **Security:** Backend enforces rules even if frontend is bypassed
- **Maintainability:** Changes to business logic only require backend updates

### 3. Simplified Frontend Code

The API route went from ~150 lines to ~100 lines by removing:
- Rate limiting logic (60+ lines)
- Validation logic (15+ lines)
- Supabase client setup (10+ lines)

### 4. Better Error Handling

The new approach provides:
- **Structured errors:** Backend returns consistent `{ error, statusCode }` format
- **Graceful degradation:** Fallback error messages if backend response is malformed
- **Network resilience:** Catches and handles network failures separately

## Alternatives Considered

### Alternative 1: Keep Rate Limiting in Next.js

**Pros:**
- Reduces backend load
- Faster response for rate-limited requests

**Cons:**
- Duplicates logic between frontend and backend
- Rate limits don't work if backend is called directly
- Harder to maintain consistency

**Why we didn't choose this:** Backend should own all business logic for security and consistency.

### Alternative 2: Remove Next.js API Routes Entirely

**Pros:**
- Simplest architecture
- Frontend calls backend directly

**Cons:**
- Exposes backend URL to clients
- Can't add middleware (auth, logging) in Next.js layer
- Harder to add caching or request transformation later

**Why we didn't choose this:** The proxy layer provides flexibility for future enhancements like caching, request batching, or authentication.

### Alternative 3: Use GraphQL Instead of REST

**Pros:**
- More flexible queries
- Reduces over-fetching

**Cons:**
- More complex setup
- Overkill for simple CRUD operations
- Steeper learning curve

**Why we didn't choose this:** REST is simpler and sufficient for this application's needs.

## Key Concepts

### 1. API Proxy Pattern

The Next.js API route acts as a **reverse proxy**:
```
Client → Next.js API Route → NestJS Backend → Database
```

Benefits:
- Hides backend implementation details from clients
- Allows request/response transformation
- Enables caching, rate limiting, or auth at the edge

### 2. Error Propagation

Errors flow through the system:
1. **Backend** generates error (validation, rate limit, database)
2. **Next.js route** receives error, preserves status code and message
3. **Frontend** displays error to user

Each layer adds context but preserves the original error information.

### 3. Header Forwarding

IP headers must be forwarded for rate limiting:
```typescript
'x-forwarded-for': request.headers.get('x-forwarded-for')!,
'x-real-ip': request.headers.get('x-real-ip')!,
```

These headers contain the **original client IP** when requests pass through proxies (Vercel, Cloudflare, etc.).

### 4. Fetch API vs Supabase Client

**Supabase Client:**
- Custom query builder syntax
- Automatic error handling
- Built-in retry logic

**Fetch API:**
- Standard JavaScript API
- More explicit error handling
- Works with any HTTP backend

### 5. Environment Variables in Next.js

`NEXT_PUBLIC_*` variables are:
- Embedded in the client-side JavaScript bundle
- Visible to users in browser DevTools
- Safe for public URLs (not secrets!)

## Potential Pitfalls

### 1. Missing API_URL Environment Variable

**Problem:** If `NEXT_PUBLIC_API_URL` is not set, all requests fail.

**Solution:** We check for `API_URL` at the start of each handler:
```typescript
if (!API_URL) {
  return NextResponse.json(
    { error: 'API URL is not configured.' },
    { status: 500 }
  );
}
```

**Prevention:** Document the variable in `.env.example` and deployment guides.

### 2. CORS Issues

**Problem:** Browser blocks requests if backend doesn't allow the frontend origin.

**Solution:** Backend must configure CORS:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
});
```

**Prevention:** Set `CORS_ORIGIN` environment variable in backend.

### 3. Rate Limit Headers Not Forwarded

**Problem:** If IP headers aren't forwarded, backend sees Next.js server IP instead of client IP.

**Solution:** Always forward `x-forwarded-for` and `x-real-ip` headers.

**Prevention:** Test rate limiting in production-like environment (behind a proxy).

### 4. Error Response Format Mismatch

**Problem:** If backend changes error format, frontend breaks.

**Solution:** Use `.catch()` fallback when parsing error responses:
```typescript
const errorPayload = await response.json().catch(() => ({
  error: 'Failed to create love note',
}));
```

**Prevention:** Document error response format in API contract.

### 5. Network Timeouts

**Problem:** If backend is slow or unreachable, requests hang indefinitely.

**Solution:** Add timeout to fetch requests (future enhancement):
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

const response = await fetch(url, {
  signal: controller.signal,
});
```

**Prevention:** Monitor backend response times and set appropriate timeouts.

### 6. Retry-After Header Format

**Problem:** `Retry-After` can be a number (seconds) or HTTP date string.

**Current implementation:** Backend sends seconds as string, we forward as-is.

**Future consideration:** Parse and validate the header format if backend changes.

## What You Learned

### Technical Skills

1. **API Proxy Pattern:** How to create a thin proxy layer in Next.js that forwards requests to a backend
2. **Fetch API:** Using the standard `fetch()` API for HTTP requests with proper error handling
3. **Header Forwarding:** Why and how to forward IP headers for rate limiting behind proxies
4. **Error Handling:** Implementing robust error handling with fallbacks for malformed responses
5. **Environment Variables:** Using `NEXT_PUBLIC_*` variables in Next.js for client-side configuration

### Architecture Principles

1. **Separation of Concerns:** Frontend handles UI, backend handles business logic
2. **Single Source of Truth:** Validation and rate limiting rules live in one place (backend)
3. **Graceful Degradation:** Always provide fallback error messages
4. **Explicit Error Handling:** Check `response.ok` and handle different status codes appropriately

### Migration Strategy

1. **Incremental Migration:** Replace one API route at a time
2. **Maintain Compatibility:** Keep the same response format for frontend components
3. **Simplify Frontend:** Remove business logic from frontend as backend takes over
4. **Test Thoroughly:** Verify all error scenarios (validation, rate limiting, network failures)

### Next Steps

- Apply the same pattern to the comments API route (`/api/love-wall/[id]/comments/route.ts`)
- Update frontend components to handle the new error format (if needed)
- Test the integration with the running NestJS backend
- Monitor for CORS issues in production deployment
