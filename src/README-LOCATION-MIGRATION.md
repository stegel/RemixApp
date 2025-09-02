# Location Field Migration Guide

If you're seeing errors related to the "location" column not existing in your teams table, this means you have an existing database that needs to be updated with the new location field.

## Quick Fix

**Option 1: Migration Script (Recommended)**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `/migration-script.sql`
4. Paste and run the script
5. Refresh the application

**Option 2: Full Schema Refresh**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor  
3. Copy the contents of `/database-schema.sql`
4. Paste and run the script (⚠️ **Warning**: This will recreate tables and lose existing data)
5. Refresh the application

## What the Migration Does

The migration script safely:
- Adds a new `location VARCHAR(255)` column to the existing `teams` table
- Preserves all your existing team and evaluation data
- Can be run multiple times safely (uses `ADD COLUMN IF NOT EXISTS`)

## About the Location Field

The location field allows you to specify where each team is based:
- Physical locations (e.g., "San Francisco", "New York", "Building A") 
- Virtual locations (e.g., "Remote", "Distributed")
- Any organizational identifier that helps categorize teams geographically

The location field:
- Is completely optional - can be left empty
- Displays in the Team Summary table with a 📍 icon
- Shows as "Not specified" when empty in management tables
- Can be edited anytime through the Teams management interface

## Need Help?

If you're still seeing errors after running the migration:
1. Check your Supabase project has the proper permissions
2. Try refreshing the PostgREST schema cache using the refresh button in the app
3. Verify the migration ran successfully by checking your teams table in Supabase Table Editor