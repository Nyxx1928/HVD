# Data Migration Guide: Supabase to PostgreSQL

This guide provides comprehensive instructions for migrating your Valentine's Love Wall data from Supabase to the self-hosted PostgreSQL backend.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Migration Process](#migration-process)
- [Validation Steps](#validation-steps)
- [Rollback Procedure](#rollback-procedure)
- [Troubleshooting](#troubleshooting)

## Overview

The migration script (`backend/scripts/migrate-from-supabase.ts`) transfers all love notes and comments from your Supabase database to the new PostgreSQL database while preserving:

- All record IDs (UUIDs)
- All timestamps
- All relationships between notes and comments
- All data integrity

**Key Features:**
- ✅ Idempotent - safe to run multiple times
- ✅ Automatic validation
- ✅ JSON backups created before import
- ✅ Batch processing for performance
- ✅ Detailed progress reporting

## Prerequisites

Before starting the migration, ensure you have:

1. **Supabase Access:**
   - Your Supabase project URL
   - Your Supabase service role key (not the anon key)
   - Access to the `love_wall` and `love_wall_comments` tables

2. **PostgreSQL Database:**
   - PostgreSQL 16+ running (via Docker or standalone)
   - Database schema already created (run `npx prisma migrate deploy`)
   - Empty database (or the script will validate existing data)

3. **Backend Setup:**
   - Node.js 20+ installed
   - Backend dependencies installed (`npm install`)
   - Prisma client generated (`npx prisma generate`)

4. **Network Access:**
   - Ability to connect to both Supabase and PostgreSQL
   - No firewall blocking either connection

## Environment Variables

### Required for Migration

Add these variables to your `.env` file in the `backend/` directory:

```bash
# Supabase Configuration (for migration only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# PostgreSQL Configuration (already required for backend)
DATABASE_URL=postgresql://user:password@localhost:5432/lovewall
```

### Finding Your Supabase Credentials

1. **Supabase URL:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL"
   - Format: `https://xxxxxxxxxxxxx.supabase.co`

2. **Supabase Service Role Key:**
   - In the same API settings page
   - Find "Project API keys" section
   - Copy the "service_role" key (NOT the "anon" key)
   - ⚠️ **Important:** The service role key has full database access - keep it secure!

### Example .env File

```bash
# Database
DATABASE_URL=postgresql://lovewall:mypassword@localhost:5432/lovewall

# Server (not needed for migration)
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Supabase Migration (temporary - can remove after migration)
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Migration Process

### Step 1: Prepare the Database

Ensure your PostgreSQL database is running and the schema is created:

```bash
# If using Docker Compose
docker compose up postgres -d

# Wait for PostgreSQL to be ready
docker compose exec postgres pg_isready

# Run Prisma migrations to create schema
cd backend
npx prisma migrate deploy
```

Verify the database is empty and ready:

```bash
# Check current record counts (should be 0)
npx prisma studio
```

### Step 2: Configure Environment Variables

Create or update your `backend/.env` file with the Supabase credentials:

```bash
# Add these lines to backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

### Step 3: Run the Migration Script

Execute the migration from the backend directory:

```bash
cd backend
npm run migrate:from-supabase
```

**Alternative:** Run directly with environment variables:

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_KEY=your-key \
npm run migrate:from-supabase
```

### Step 4: Monitor Progress

The script provides detailed progress output:

```
🚀 Starting migration from Supabase to PostgreSQL...

🔍 Checking if migration already completed...
   ✓ Database is empty, proceeding with migration

📤 Exporting data from Supabase...
   → Fetching love notes from Supabase...
   ✓ Exported 245 love notes
   → Fetching comments from Supabase...
   ✓ Exported 128 comments

💾 Saving backup files...
   ✓ Saved love-notes-2024-01-15T10-30-00-000Z.json
   ✓ Saved comments-2024-01-15T10-30-00-000Z.json
   ✓ Backups saved to ./migration-backups

📥 Importing data to PostgreSQL...
   → Importing love notes batch 1/3...
   → Importing love notes batch 2/3...
   → Importing love notes batch 3/3...
   ✓ Imported 245 love notes
   → Importing comments batch 1/2...
   → Importing comments batch 2/2...
   ✓ Imported 128 comments

✅ Validating migration...
   → Checking record counts...
   ✓ Love notes count matches: 245
   ✓ Comments count matches: 128
   → Verifying random sample of records...
   ✓ All 20 sample records match
   → Checking foreign key relationships...
   ✓ All foreign key relationships intact
   ✓ All validations passed!

🎉 Migration completed!

📊 Migration Summary:
─────────────────────────────────────
Status:            ✅ Success
Notes Exported:    245
Notes Imported:    245
Comments Exported: 128
Comments Imported: 128
Validation:        ✅ All Passed
─────────────────────────────────────
```

### Step 5: Verify Migration Success

The script automatically validates the migration, but you can perform additional checks:

```bash
# Open Prisma Studio to browse the data
npx prisma studio

# Or use psql to query directly
docker compose exec postgres psql -U lovewall -d lovewall -c "SELECT COUNT(*) FROM love_notes;"
docker compose exec postgres psql -U lovewall -d lovewall -c "SELECT COUNT(*) FROM comments;"
```

## Validation Steps

The migration script automatically performs three levels of validation:

### 1. Record Count Validation

Compares the total number of records between Supabase and PostgreSQL:

- ✅ **Pass:** Counts match exactly
- ❌ **Fail:** Counts differ (indicates incomplete migration)

### 2. Sample Data Verification

Randomly selects 10% of records (minimum 1, maximum 10) and verifies:

- Record exists in PostgreSQL
- All fields match exactly (name, message, emoji, color, timestamps)
- No data corruption or transformation errors

### 3. Foreign Key Integrity Check

Verifies all relationships are intact:

- Every comment has a valid `note_id` pointing to an existing love note
- No orphaned comments (comments without a parent note)
- Database constraints are satisfied

### Manual Verification Steps

After the automated validation, you can manually verify:

#### Check Specific Records

```bash
# Compare a specific note between Supabase and PostgreSQL
# 1. Find a note ID in Supabase dashboard
# 2. Query it in PostgreSQL:

docker compose exec postgres psql -U lovewall -d lovewall -c \
  "SELECT * FROM love_notes WHERE id = 'your-uuid-here';"
```

#### Verify Timestamps

```bash
# Check that timestamps are preserved correctly
docker compose exec postgres psql -U lovewall -d lovewall -c \
  "SELECT id, name, created_at FROM love_notes ORDER BY created_at DESC LIMIT 5;"
```

#### Check Comment Relationships

```bash
# Verify comments are linked to correct notes
docker compose exec postgres psql -U lovewall -d lovewall -c \
  "SELECT c.id, c.note_id, c.name, c.comment, n.message 
   FROM comments c 
   JOIN love_notes n ON c.note_id = n.id 
   LIMIT 5;"
```

#### Test the Application

1. Start the backend:
   ```bash
   npm run start:dev
   ```

2. Test the API endpoints:
   ```bash
   # Get all notes
   curl http://localhost:3001/love-notes
   
   # Get comments for a specific note
   curl http://localhost:3001/love-notes/{note-id}/comments
   ```

3. Start the frontend and verify the UI displays all data correctly

## Rollback Procedure

If the migration fails or you need to revert, follow these steps:

### Option 1: Clear PostgreSQL and Retry

If the migration failed partway through:

```bash
# 1. Stop the backend
docker compose stop backend

# 2. Reset the database
cd backend
npx prisma migrate reset --force

# 3. Fix any issues (check error messages)

# 4. Re-run the migration
npm run migrate:from-supabase
```

### Option 2: Restore from JSON Backups

The migration script creates JSON backups in `backend/migration-backups/`:

```bash
# 1. List available backups
ls -lh backend/migration-backups/

# 2. Inspect backup files
cat backend/migration-backups/love-notes-*.json | jq '.[0]'
cat backend/migration-backups/comments-*.json | jq '.[0]'

# 3. If needed, manually import from backups using a custom script
# (The backup files are standard JSON arrays)
```

### Option 3: Keep Using Supabase

If you need to revert to Supabase temporarily:

```bash
# 1. In the frontend, revert the API changes
cd valentines
git checkout HEAD -- app/api/

# 2. Reinstall Supabase client
npm install @supabase/supabase-js

# 3. Restore Supabase environment variables
# Edit valentines/.env.local and add back:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 4. Remove NestJS backend URL
# Remove or comment out:
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Data Integrity Guarantee

**Important:** The migration script NEVER modifies or deletes data in Supabase. Your original data remains intact and can be used as the source of truth if needed.

## Troubleshooting

### Common Issues and Solutions

#### Issue: Missing Environment Variables

**Error:**
```
❌ Error: Missing required environment variables
Please set SUPABASE_URL and SUPABASE_KEY
```

**Solution:**
1. Verify `backend/.env` file exists
2. Check that `SUPABASE_URL` and `SUPABASE_KEY` are set
3. Ensure no extra spaces or quotes around values
4. Try running with inline environment variables:
   ```bash
   SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=your-key npm run migrate:from-supabase
   ```

#### Issue: Database Connection Failed

**Error:**
```
❌ Migration failed: Can't reach database server
```

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   docker compose ps postgres
   ```
2. Verify `DATABASE_URL` in `.env` is correct
3. Test connection manually:
   ```bash
   docker compose exec postgres pg_isready
   ```
4. Check firewall/network settings

#### Issue: Supabase Connection Failed

**Error:**
```
Failed to export love notes: FetchError: request to https://xxx.supabase.co failed
```

**Solution:**
1. Verify `SUPABASE_URL` is correct (should start with `https://`)
2. Check `SUPABASE_KEY` is the **service_role** key, not anon key
3. Ensure your network can reach Supabase (check firewall/proxy)
4. Test Supabase connection in browser: visit your Supabase dashboard

#### Issue: Permission Denied

**Error:**
```
Error: permission denied for table love_wall
```

**Solution:**
1. Verify you're using the **service_role** key, not the anon key
2. Check Supabase RLS (Row Level Security) policies
3. Temporarily disable RLS for migration:
   - Go to Supabase Dashboard → Authentication → Policies
   - Disable RLS on `love_wall` and `love_wall_comments` tables
   - Re-enable after migration

#### Issue: Data Already Exists

**Output:**
```
⚠️  Database already contains data:
   - 245 love notes
   - 128 comments

🔄 Running validation on existing data...
```

**This is normal!** The script is idempotent. It will:
- Validate existing data against Supabase
- Report any discrepancies
- NOT duplicate any data

**If you want to re-run the migration:**
```bash
# Clear the database first
npx prisma migrate reset --force
npm run migrate:from-supabase
```

#### Issue: Validation Failures

**Error:**
```
❌ Validation failed:
  - Love notes count mismatch: expected 245, got 243
  - Sample note abc-123 not found in PostgreSQL
```

**Solution:**
1. Check the detailed validation report
2. Review backup files in `./migration-backups/`
3. Clear database and retry:
   ```bash
   npx prisma migrate reset --force
   npm run migrate:from-supabase
   ```
4. If issue persists, check for:
   - Network interruptions during migration
   - Database constraints or triggers
   - Disk space issues

#### Issue: Foreign Key Violations

**Error:**
```
❌ Validation failed:
  - Found 5 orphaned comments
```

**Solution:**
1. This indicates comments in Supabase reference non-existent notes
2. Check Supabase data integrity:
   ```sql
   SELECT c.* FROM love_wall_comments c
   LEFT JOIN love_wall n ON c.note_id = n.id
   WHERE n.id IS NULL;
   ```
3. Options:
   - Fix data in Supabase before migration
   - Manually delete orphaned comments
   - Modify migration script to skip orphaned comments

#### Issue: Out of Memory

**Error:**
```
JavaScript heap out of memory
```

**Solution:**
1. Increase Node.js memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run migrate:from-supabase
   ```
2. For very large datasets (10,000+ records), consider:
   - Running migration on a machine with more RAM
   - Modifying script to use smaller batch sizes
   - Processing in multiple stages

### Getting Help

If you encounter issues not covered here:

1. **Check the logs:** The migration script provides detailed error messages
2. **Review backup files:** JSON backups in `./migration-backups/` can help diagnose issues
3. **Test connections separately:**
   - Test Supabase: Use Supabase dashboard or API
   - Test PostgreSQL: Use `psql` or Prisma Studio
4. **Check GitHub Issues:** Search for similar problems in the project repository
5. **Ask for help:** Include the full error message and migration output

## Post-Migration Cleanup

After successful migration and verification:

### 1. Remove Supabase Credentials

```bash
# Edit backend/.env and remove or comment out:
# SUPABASE_URL=...
# SUPABASE_KEY=...
```

### 2. Archive Backup Files

```bash
# Move backups to a safe location
mkdir -p ~/backups/lovewall-migration
mv backend/migration-backups/* ~/backups/lovewall-migration/

# Or compress them
cd backend
tar -czf migration-backups-$(date +%Y%m%d).tar.gz migration-backups/
```

### 3. Update Documentation

Document your migration in your project notes:
- Date of migration
- Number of records migrated
- Any issues encountered
- Backup file locations

### 4. Monitor the Application

After migration, monitor for:
- Any missing data in the UI
- Unexpected errors in logs
- Performance issues
- User reports of missing content

## Best Practices

### Before Migration

- ✅ Test the migration on a staging environment first
- ✅ Backup your Supabase data (the script does this automatically)
- ✅ Verify PostgreSQL has enough disk space
- ✅ Schedule migration during low-traffic periods
- ✅ Notify users of potential downtime

### During Migration

- ✅ Monitor the progress output
- ✅ Don't interrupt the process
- ✅ Keep terminal window open
- ✅ Watch for error messages

### After Migration

- ✅ Verify all data is present
- ✅ Test all application features
- ✅ Keep Supabase data intact for 30 days (as backup)
- ✅ Monitor application logs for errors
- ✅ Archive migration backups securely

## Migration Checklist

Use this checklist to ensure a smooth migration:

- [ ] PostgreSQL database is running
- [ ] Database schema is created (`npx prisma migrate deploy`)
- [ ] Supabase URL and service role key are available
- [ ] Environment variables are configured in `backend/.env`
- [ ] Backend dependencies are installed
- [ ] Backup strategy is in place
- [ ] Migration script runs successfully
- [ ] All validation checks pass
- [ ] Manual verification completed
- [ ] Application tested with migrated data
- [ ] Backup files archived
- [ ] Supabase credentials removed from `.env`
- [ ] Documentation updated

## Additional Resources

- **Prisma Documentation:** https://www.prisma.io/docs
- **Supabase API Reference:** https://supabase.com/docs/reference/javascript
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Backend README:** See `backend/README.md` for general setup
- **Deployment Guide:** See `backend/DEPLOYMENT.md` for production deployment

---

**Need Help?** If you encounter issues during migration, refer to the [Troubleshooting](#troubleshooting) section or check the project's issue tracker.
