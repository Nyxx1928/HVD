# Lesson: Building a Data Migration Script from Supabase to PostgreSQL

## Task Context

- **Goal**: Create a robust migration script that transfers all existing love notes and comments from Supabase to our new self-hosted PostgreSQL database
- **Scope**: Export data from Supabase, save JSON backups, import to PostgreSQL using Prisma, and validate the migration
- **Constraints**: Must be idempotent (safe to run multiple times), preserve all data including UUIDs and timestamps, and provide clear progress feedback

## Step-by-Step Changes

1. **Installed Supabase client as dev dependency**
   - Added `@supabase/supabase-js` to devDependencies
   - This is only needed for the migration script, not for the running application

2. **Created migration script at `backend/scripts/migrate-from-supabase.ts`**
   - Defined TypeScript interfaces for LoveNote and Comment data structures
   - Created a `DataMigrator` class to encapsulate all migration logic
   - Implemented constructor that initializes both Supabase and Prisma clients

3. **Implemented export methods**
   - `exportLoveNotes()`: Fetches all records from Supabase `love_wall` table
   - `exportComments()`: Fetches all records from Supabase `love_wall_comments` table
   - Both methods order by `created_at` to maintain chronological order

4. **Implemented backup functionality**
   - `saveBackup()`: Writes exported data to timestamped JSON files
   - Creates a `migration-backups` directory automatically
   - Provides a safety net in case something goes wrong during import

5. **Implemented import methods with batch processing**
   - `importLoveNotes()`: Inserts love notes in batches of 100 using Prisma
   - `importComments()`: Inserts comments in batches of 100 using Prisma
   - Used `createMany()` with `skipDuplicates: true` for idempotency
   - Batch processing prevents memory issues with large datasets

6. **Implemented validation**
   - `validateMigration()`: Compares record counts between source and destination
   - Checks for orphaned comments (comments without a parent note)
   - Returns detailed error messages if validation fails

7. **Added idempotency check**
   - Before starting migration, checks if database already has records
   - Prevents accidental duplicate imports
   - Provides clear message if migration already completed

8. **Created main orchestration method**
   - `migrate()`: Coordinates all steps in the correct order
   - Provides detailed console output with emojis for better UX
   - Handles errors gracefully and provides summary report

9. **Added npm script**
   - Added `migrate:from-supabase` script to `package.json`
   - Uses `ts-node` to run TypeScript directly without compilation

10. **Updated environment documentation**
    - Added `SUPABASE_URL` and `SUPABASE_KEY` to `.env.example`
    - Documented that these are only needed for migration

## Why This Approach

**Batch Processing**: Instead of inserting records one at a time, we use batches of 100. This significantly improves performance for large datasets while keeping memory usage reasonable.

**Idempotency**: The script checks if data already exists before starting. This makes it safe to run multiple times without creating duplicates. The `skipDuplicates: true` option in Prisma provides an additional safety layer.

**Backup Files**: Saving JSON backups before importing provides a safety net. If something goes wrong during import, we have the original data saved locally and can investigate or retry.

**Validation**: After importing, we verify that the counts match and that all foreign key relationships are intact. This catches issues early rather than discovering them later in production.

**Clear Progress Feedback**: The script provides detailed console output with emojis and formatting. This helps users understand what's happening and builds confidence that the migration is working correctly.

**TypeScript Interfaces**: Defining explicit interfaces for the data structures provides type safety and makes the code self-documenting.

## Alternatives Considered

**Option 1: Direct SQL dump and restore**
- Pros: Fastest for very large datasets, preserves all database features
- Cons: Requires matching database schemas exactly, harder to transform data, less portable
- Why not chosen: Our schemas differ slightly (table names, some field types), and we want a solution that works regardless of database version

**Option 2: Manual CSV export/import**
- Pros: Simple, works with any database
- Cons: Loses type information, requires manual steps, error-prone for relationships
- Why not chosen: Too manual, doesn't preserve UUIDs reliably, difficult to maintain foreign key relationships

**Option 3: Real-time sync during cutover**
- Pros: Zero downtime, can gradually migrate users
- Cons: Much more complex, requires running both systems simultaneously
- Why not chosen: Overkill for this use case, adds significant complexity

**Option 4: One-by-one inserts without batching**
- Pros: Simpler code, easier to debug individual records
- Cons: Very slow for large datasets, more database round trips
- Why not chosen: Performance would be poor with hundreds or thousands of records

## Key Concepts

**Data Migration**: The process of transferring data from one system to another while preserving integrity and relationships. Migrations are common when changing databases, upgrading systems, or consolidating data sources.

**Idempotency**: A property where an operation can be performed multiple times without changing the result beyond the initial application. In our case, running the migration twice won't create duplicate records.

**Batch Processing**: Processing data in groups (batches) rather than one item at a time. This reduces overhead and improves performance by minimizing database round trips.

**Foreign Key Relationships**: Database constraints that ensure data integrity by linking records in different tables. Comments must reference valid love notes through the `note_id` field.

**Prisma's createMany()**: A Prisma method that inserts multiple records in a single database operation. Much more efficient than multiple individual inserts.

**Environment Variables**: Configuration values stored outside the code. We use them for sensitive data like API keys and for values that differ between environments (development, production).

**TypeScript Interfaces**: Contracts that define the shape of data. They provide compile-time type checking and make code more maintainable.

**Validation**: The process of verifying that data meets expected criteria. We validate both input data (from Supabase) and output data (in PostgreSQL) to ensure migration success.

## Potential Pitfalls

**Missing Environment Variables**: The script requires `SUPABASE_URL` and `SUPABASE_KEY`. If these aren't set, the script will fail with a clear error message. Always check your `.env` file before running.

**Database Connection Issues**: If PostgreSQL isn't running or the `DATABASE_URL` is incorrect, the script will fail. Make sure your database is accessible before starting the migration.

**Insufficient Permissions**: The Supabase key must have read access to the tables. Using the service role key (not the anon key) is recommended for migrations.

**Large Datasets**: While batch processing helps, migrating millions of records could still take significant time. Monitor memory usage and consider adjusting the batch size if needed.

**Timezone Handling**: Timestamps are converted from strings to Date objects. Ensure your PostgreSQL timezone settings match your expectations to avoid time shifts.

**Orphaned Comments**: If a comment references a note_id that doesn't exist in the love_wall table, the import will fail due to foreign key constraints. The validation step catches this.

**Running Migration Twice**: While the script is idempotent, it's still best practice to only run it once. The script checks for existing data and will skip if already migrated.

**Network Interruptions**: If the network connection to Supabase fails mid-export, the script will throw an error. The backup files are only saved after successful export, so you'll need to retry.

## What You Learned

In this lesson, you learned how to build a production-ready data migration script that:

1. **Safely transfers data** between different database systems (Supabase to PostgreSQL)
2. **Uses batch processing** to handle large datasets efficiently
3. **Implements idempotency** to prevent duplicate data on re-runs
4. **Creates backups** as a safety measure before making changes
5. **Validates results** to ensure data integrity after migration
6. **Provides clear feedback** through well-formatted console output
7. **Handles errors gracefully** with meaningful error messages
8. **Uses TypeScript** for type safety and better code maintainability

You also learned important concepts like foreign key relationships, batch processing, and why validation is crucial in data migrations. These skills are transferable to any data migration scenario you might encounter in your development career.

The migration script is now ready to use! When you're ready to migrate your data, simply set the `SUPABASE_URL` and `SUPABASE_KEY` environment variables and run:

```bash
npm run migrate:from-supabase
```

The script will guide you through the process with clear progress indicators and let you know if anything goes wrong.
