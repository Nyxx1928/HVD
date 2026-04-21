# Lesson: Adding Migration npm Script and Documentation

## Task Context

- **Goal**: Make the data migration script easily accessible through npm and provide comprehensive documentation for users
- **Scope**: Add npm script to package.json and document the migration process in README.md
- **Constraints**: Must clearly explain required environment variables and migration behavior

## Step-by-Step Changes

### 1. Added npm Script to package.json

The migration script was already added to `backend/package.json`:

```json
"scripts": {
  "migrate:from-supabase": "ts-node -r tsconfig-paths/register scripts/migrate-from-supabase.ts"
}
```

This script:
- Uses `ts-node` to run TypeScript directly without compilation
- Includes `-r tsconfig-paths/register` to support path aliases from `tsconfig.json`
- Points to the migration script at `scripts/migrate-from-supabase.ts`

### 2. Updated Available Scripts Section

Added the migration script to the list of available commands in README.md so users can discover it easily.

### 3. Created Comprehensive Migration Documentation

Added a new "Migrating Data from Supabase" section to README.md that includes:

- **Prerequisites**: What users need before running the migration
- **Environment Variables**: Clear examples for both Unix/Mac and Windows
- **Migration Steps**: Step-by-step instructions with actual commands
- **What the Migration Does**: Detailed explanation of the 5-phase process
- **Migration Output**: Example of what users will see during execution
- **Idempotency**: Explanation that the script can be safely re-run
- **Troubleshooting**: Common errors and their solutions

## Why This Approach

### npm Script Benefits

Using an npm script provides several advantages:

1. **Consistency**: Users run migrations the same way they run other project commands
2. **Discoverability**: Listed in `package.json` scripts section and `npm run` output
3. **Environment**: Automatically uses the project's Node.js and dependencies
4. **Documentation**: Self-documenting through the script name

### ts-node for Migration Scripts

We use `ts-node` instead of compiling to JavaScript because:

1. **Development Convenience**: No build step needed for one-time operations
2. **Type Safety**: Full TypeScript checking during execution
3. **Path Aliases**: Support for `tsconfig-paths` makes imports cleaner
4. **Debugging**: Easier to debug TypeScript directly

### Comprehensive Documentation

The documentation follows best practices:

1. **Progressive Disclosure**: Start with simple steps, then provide details
2. **Multiple Platforms**: Include both Unix and Windows commands
3. **Visual Feedback**: Show example output so users know what to expect
4. **Error Handling**: Document common problems and solutions
5. **Safety**: Explain idempotency to reduce user anxiety

## Alternatives Considered

### Alternative 1: Compiled Migration Script

**Approach**: Compile the migration script to JavaScript and run with `node`

```json
"migrate:from-supabase": "npm run build && node dist/scripts/migrate-from-supabase.js"
```

**Pros**:
- Faster execution (no compilation during runtime)
- Matches production deployment approach

**Cons**:
- Requires build step before migration
- More complex for users (two-step process)
- Build artifacts clutter the repository

**Decision**: Rejected because migrations are infrequent operations where convenience matters more than performance.

### Alternative 2: Interactive CLI Tool

**Approach**: Create an interactive CLI that prompts for environment variables

```typescript
const supabaseUrl = await prompt('Enter Supabase URL:');
const supabaseKey = await prompt('Enter Supabase Key:');
```

**Pros**:
- User-friendly for non-technical users
- No need to understand environment variables
- Can validate inputs before starting

**Cons**:
- Harder to automate in CI/CD pipelines
- Requires additional dependencies (inquirer, prompts)
- Can't be scripted or scheduled

**Decision**: Rejected because environment variables are more flexible and scriptable.

### Alternative 3: Separate Migration Package

**Approach**: Create a standalone npm package for migrations

```bash
npx @lovewall/migrate --from supabase --to postgres
```

**Pros**:
- Reusable across multiple projects
- Can be versioned independently
- Professional appearance

**Cons**:
- Overkill for a single-use migration
- Maintenance overhead
- Adds complexity for a one-time operation

**Decision**: Rejected because this is a project-specific migration, not a general-purpose tool.

## Key Concepts

### npm Scripts

npm scripts are commands defined in `package.json` that can be run with `npm run <script-name>`. They:

- Run in a shell with `node_modules/.bin` in the PATH
- Can chain multiple commands with `&&`
- Support pre/post hooks (e.g., `premigrate`, `postmigrate`)
- Are the standard way to define project tasks

### ts-node

`ts-node` is a TypeScript execution engine that:

- Compiles TypeScript on-the-fly without generating files
- Supports all TypeScript features including decorators
- Integrates with `tsconfig.json` for configuration
- Is perfect for scripts, REPLs, and development tools

### Environment Variables

Environment variables are key-value pairs that:

- Configure applications without changing code
- Keep secrets out of version control
- Allow different configurations per environment
- Are the standard way to configure 12-factor apps

### Idempotency

An idempotent operation can be performed multiple times with the same result:

- First run: Performs the migration
- Subsequent runs: Validates existing data
- Never duplicates data or causes errors
- Critical for safe automation and recovery

### Documentation as Code

Keeping documentation in the repository:

- Stays in sync with code changes
- Is versioned alongside the code
- Can be reviewed in pull requests
- Is accessible to all developers

## Potential Pitfalls

### Pitfall 1: Missing Environment Variables

**Problem**: Users forget to set `SUPABASE_URL` or `SUPABASE_KEY`

**Symptom**:
```
❌ Error: Missing required environment variables
```

**Solution**: The migration script checks for required variables and provides clear error messages with examples.

### Pitfall 2: Wrong DATABASE_URL

**Problem**: `DATABASE_URL` points to the wrong database or uses incorrect credentials

**Symptom**:
```
❌ Migration failed: Can't reach database server
```

**Solution**: Documentation includes troubleshooting section and reminds users to verify the connection string.

### Pitfall 3: Running Migration Multiple Times

**Problem**: Users worry about running the script twice and duplicating data

**Symptom**: User hesitation and support questions

**Solution**: Documentation explicitly explains idempotency and shows what happens on subsequent runs.

### Pitfall 4: Platform-Specific Commands

**Problem**: Unix commands don't work on Windows and vice versa

**Symptom**: Users on Windows can't set environment variables with `export`

**Solution**: Documentation provides both Unix and Windows (PowerShell) examples.

### Pitfall 5: Forgetting to Run Migrations First

**Problem**: Users run data migration before running Prisma schema migrations

**Symptom**:
```
❌ Migration failed: relation "love_notes" does not exist
```

**Solution**: Documentation lists prerequisites including database setup and schema migrations.

### Pitfall 6: Service Role Key vs Anon Key

**Problem**: Users try to use the Supabase anon key instead of the service role key

**Symptom**: Permission errors when trying to read all data

**Solution**: Documentation specifically mentions "service role key" to guide users to the correct key.

## What You Learned

### Technical Skills

1. **npm Scripts**: How to add custom commands to package.json for project-specific tasks
2. **ts-node Configuration**: Using `-r tsconfig-paths/register` to support TypeScript path aliases
3. **Documentation Structure**: Organizing technical documentation with prerequisites, steps, and troubleshooting
4. **Cross-Platform Commands**: Providing examples for both Unix and Windows environments
5. **User Experience**: Anticipating user questions and addressing them proactively in documentation

### Best Practices

1. **Discoverability**: Make features easy to find through consistent naming and documentation
2. **Progressive Disclosure**: Start simple, then provide details for those who need them
3. **Error Prevention**: Document prerequisites and common mistakes before users encounter them
4. **Idempotency**: Design operations that can be safely repeated
5. **Examples**: Show actual command output so users know what to expect

### Migration Strategy

1. **Environment Variables**: Use environment variables for configuration instead of hardcoding
2. **Validation**: Always validate the migration results automatically
3. **Backups**: Save exported data before importing to enable recovery
4. **Logging**: Provide detailed progress information during long-running operations
5. **Safety**: Make operations idempotent to prevent accidental data duplication

### Documentation Principles

1. **Completeness**: Cover prerequisites, steps, output, troubleshooting, and edge cases
2. **Clarity**: Use clear headings and formatting to make information scannable
3. **Accessibility**: Provide examples for different platforms and skill levels
4. **Maintenance**: Keep documentation in the repository alongside the code
5. **User-Centric**: Write from the user's perspective, not the developer's

This task demonstrates that good documentation is as important as good code. A well-documented feature is easier to use, generates fewer support requests, and provides a better user experience.
