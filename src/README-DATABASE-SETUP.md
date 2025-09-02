# Database Setup Instructions

## IMPORTANT: Run this first before using the application!

The AI judging form application requires Supabase database tables to function. Follow these steps to set up your database:

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Make sure you're in the correct project

### Step 2: Navigate to SQL Editor
1. Click on "SQL Editor" in the left sidebar
2. Create a new query

### Step 3: Run the Database Schema
1. Open the `/database-schema.sql` file from your project
2. Copy ALL the contents of the file
3. Paste it into the SQL Editor
4. Click "Run" to execute the script

### Step 4: Verify Setup
1. Check that the script ran without errors
2. Refresh your application page
3. You should see "Database Ready" status in the header

## What gets created:
- `teams` table - for managing participating teams
- `evaluations` table - for storing judging responses  
- Database functions for analytics
- Row Level Security policies
- Performance indexes
- Sample data (commented out - optional)

## Troubleshooting:

### "Could not find the table" errors:
1. **First time setup**: The database schema hasn't been run yet - follow steps 1-4 above
2. **After running SQL**: Supabase schema cache needs refresh - see "Schema Cache Issues" below

### Schema Cache Issues:
After creating new tables, Supabase's PostgREST API may not immediately recognize them due to schema caching.

**Method 1: Use the App (Recommended)**
- The app will detect schema cache issues and show a "Refresh Schema Cache" button
- Click the button and wait for confirmation

**Method 2: Manual Dashboard Refresh**
1. Go to your Supabase Dashboard
2. Navigate to Settings → API
3. Click "Reload schema" or restart the project

**Method 3: Wait**
- Schema cache typically refreshes automatically within 5-10 minutes

### Other Issues:
- **Permission errors**: Make sure you're using the correct Supabase project
- **SQL script fails**: Check the Supabase logs for specific error messages
- **Connection errors**: Verify your Supabase URL and API keys are correct

## Scoring System Update (Important!)

**New Scoring Scale: 0-4**
- **0** = Strongly Disagree
- **1** = Disagree  
- **2** = Neutral
- **3** = Agree
- **4** = Strongly Agree

### If You Have Existing Data:
If you already have evaluation data in your database from the previous 1-5 scoring system, you'll need to run the migration script:

1. **Backup your data first!**
2. Go to Supabase Dashboard → SQL Editor
3. Run the `/migration-script.sql` file to convert existing scores from 1-5 to 0-4 scale
4. Verify the conversion completed successfully

### For New Installations:
The database schema automatically uses the new 0-4 scoring system. No migration needed.

## Need Help?
The application will show detailed setup instructions and current database status in the interface.