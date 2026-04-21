# Lesson: Removing Supabase Dependencies from Frontend

## Task Context

- **Goal:** Remove Supabase client library and configuration from the Next.js frontend application
- **Scope:** Update package.json, environment files, and prepare for NestJS API integration
- **Constraints:** Must maintain environment variable documentation and provide clear migration path

## Files Modified

- valentines/package.json (modified)
- valentines/package-lock.json (modified)
- valentines/.env.example (modified)
- valentines/.env.local (modified)

## Step-by-Step Changes

1. **Removed @supabase/supabase-js from package.json**
   - Deleted the dependency line from the dependencies section
   - This removes the Supabase client library that was used to communicate with Supabase backend

2. **Updated valentines/.env.example**
   - Replaced Supabase configuration comments with Backend API documentation
   - Changed from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `NEXT_PUBLIC_API_URL`
   - Added helpful comments explaining the variable for local development and production

3. **Updated valentines/.env.local**
   - Replaced Supabase credentials with new API URL configuration
   - Set `NEXT_PUBLIC_API_URL=http://localhost:3001` for local development
   - This points to the NestJS backend running on port 3001

4. **Ran npm install**
   - Updated package-lock.json to reflect the removal of Supabase packages
   - Removed 10 packages (Supabase and its dependencies)
   - Cleaned up the node_modules directory

## Why This Approach

**Clean Break from Supabase:**
- Removing the dependency ensures we can't accidentally use Supabase client code
- Forces us to use the new NestJS API for all backend communication
- Reduces bundle size by removing unused code

**Environment Variable Strategy:**
- Using `NEXT_PUBLIC_API_URL` follows Next.js conventions for client-side environment variables
- The `NEXT_PUBLIC_` prefix makes the variable available in the browser
- Single URL variable is simpler than separate URL and key (no authentication needed for public API)

**Documentation First:**
- Updating .env.example before .env.local ensures other developers know what variables are needed
- Clear comments help future developers understand the purpose of each variable

## Alternatives Considered

**Option 1: Keep Supabase as fallback**
- Could have kept the Supabase dependency and used feature flags to switch between backends
- **Rejected:** Adds complexity and increases bundle size unnecessarily
- **Rejected:** Makes it harder to ensure complete migration

**Option 2: Use multiple API URLs**
- Could have separate environment variables for different API endpoints (notes, comments, etc.)
- **Rejected:** Single base URL is simpler and more maintainable
- **Rejected:** Backend routing handles endpoint paths, not frontend config

**Option 3: Hardcode API URL**
- Could have hardcoded `http://localhost:3001` directly in API route files
- **Rejected:** Makes it impossible to deploy to different environments
- **Rejected:** Violates 12-factor app principles (config in environment)

## Key Concepts

**Environment Variables in Next.js:**
- Variables prefixed with `NEXT_PUBLIC_` are embedded in the browser bundle at build time
- These are NOT secret - they're visible to anyone who views your page source
- Server-side variables (without prefix) are only available in API routes and server components

**Dependency Management:**
- Removing unused dependencies reduces bundle size and security surface area
- `npm install` automatically updates package-lock.json to reflect changes
- Lock file ensures consistent installs across different machines

**Migration Strategy:**
- Remove old dependencies before adding new API calls
- Update configuration first, then update code that uses it
- This prevents accidentally mixing old and new approaches

**The NEXT_PUBLIC_ Prefix:**
- Next.js uses this prefix to identify variables that should be available in the browser
- At build time, Next.js replaces `process.env.NEXT_PUBLIC_API_URL` with the actual value
- This means you can't change these values without rebuilding the application

## Potential Pitfalls

**Forgetting to Update .env.local:**
- If you only update .env.example, your local development won't work
- Always update both files when changing environment variables
- Consider adding .env.local to your setup documentation

**Using Wrong Environment Variable Name:**
- If you typo the variable name in code, it will be `undefined`
- Next.js won't warn you about missing NEXT_PUBLIC_ variables
- Always test after changing environment variables

**Not Restarting Dev Server:**
- Next.js reads environment variables at startup
- If you change .env.local while the dev server is running, you must restart it
- Changes won't take effect until restart

**Committing .env.local:**
- .env.local should be in .gitignore (it usually is by default)
- This file contains environment-specific values that shouldn't be shared
- Only .env.example should be committed to version control

**Build-Time vs Runtime:**
- NEXT_PUBLIC_ variables are embedded at build time, not runtime
- If you need runtime configuration, use API routes or server components
- This is important for Docker deployments where you want to configure at runtime

## What You Learned

**Dependency Cleanup:**
- How to remove npm packages and update lock files
- Why removing unused dependencies improves security and performance
- The importance of running `npm install` after package.json changes

**Next.js Environment Variables:**
- How NEXT_PUBLIC_ prefix works and when to use it
- The difference between client-side and server-side environment variables
- Why environment variables are better than hardcoded values

**Migration Best Practices:**
- Remove old dependencies before implementing new solutions
- Update configuration files before updating code
- Document environment variables in .env.example for other developers

**Configuration Management:**
- How to structure environment variables for different environments
- The importance of clear comments in configuration files
- Why .env.local should never be committed to version control

**Next Steps:**
- The frontend is now ready to use the NestJS API
- Next task will update the API route handlers to use fetch instead of Supabase client
- The environment variable `NEXT_PUBLIC_API_URL` will be used in those API routes
