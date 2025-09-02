# Database Schema Migration: Team Number Required

## What Changed

The application has been updated to require team numbers instead of team names:

### Before (Old Schema)
- ✅ **Team Name**: Required
- ❌ **Team Number**: Optional

### After (New Schema)  
- ❌ **Team Name**: Optional
- ✅ **Team Number**: Required

## Error: "column teams.team_number does not exist"

If you're seeing this error, it means your database is using the old schema and needs to be migrated.

## How to Fix This

### Option 1: Run the Migration Script (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `/migration-script.sql`
4. Run the SQL script
5. Refresh your application

The migration script will:
- Add the `team_number` column
- Assign sequential team numbers to existing teams
- Make team numbers required and names optional
- Update location constraints
- Preserve all your existing data

### Option 2: Reset Database (if you don't mind losing data)

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor  
3. Copy and paste the entire contents of `/database-schema.sql`
4. Run the SQL script
5. Refresh your application

## What the Migration Does

1. **Adds team_number column** if it doesn't exist
2. **Assigns sequential numbers** to existing teams (ordered by name)
3. **Makes team_number required** and adds unique constraint
4. **Makes team name optional** (removes NOT NULL constraint)
5. **Updates location constraints** to only allow: Americas, Amsterdam, Hyderabad
6. **Preserves all evaluation data** and team associations

## After Migration

- Teams will be sorted by team number instead of name
- Display shows team name if available, otherwise "Team X" where X is the team number
- CSV imports can use either team number or name (but at least one is required)
- All existing functionality continues to work

## Compatibility

The application is now backward-compatible during the transition:
- ✅ Works with old schema (sorts by name)
- ✅ Works with new schema (sorts by team number)
- ✅ Graceful error handling for missing columns
- ✅ Clear migration instructions in error messages

## Need Help?

If you encounter issues during migration:

1. **Check the migration verification queries** at the end of the script
2. **Backup your database** before running migrations
3. **Review the error logs** in your Supabase Dashboard
4. **Contact support** if you need assistance with complex data migrations

## Sample Data After Migration

```csv
Team Number,Team Name,Location
1,Engineering Team,Americas
2,Design Team,Amsterdam  
3,Product Team,Hyderabad
4,,Americas
```

Note: Row 4 shows a team with only a number (no name) - this is now valid in the new schema.