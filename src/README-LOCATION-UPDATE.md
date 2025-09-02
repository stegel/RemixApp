# Location Field Update

## What Changed

The location field in the teams table has been updated from a free-text input to a dropdown with predefined options:

- **Americas**
- **Amsterdam**
- **Hyderabad**

## For Existing Databases

If you already have teams with location data in your database, run the migration script to update your database:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `/migration-script.sql`
4. Run the SQL script

**Note:** Any existing location values that don't match the new options will be set to NULL during migration.

## CSV Import Format

When importing teams via CSV, the location column must use one of the three predefined values:

```csv
Team Number,Team Name,Location
1,Engineering Team,Americas
2,Design Team,Amsterdam
3,Product Management,Hyderabad
```

## Benefits

- **Consistency:** All teams will have standardized location values
- **Analytics:** Better reporting and filtering by location
- **Data Quality:** Prevents typos and variations in location names
- **Validation:** Both frontend and backend validate location values

## Troubleshooting

If you encounter errors when creating or updating teams:

1. **"Invalid location" error:** Ensure you're using one of the three valid values: Americas, Amsterdam, or Hyderabad
2. **Database constraint error:** Run the migration script to update your database schema
3. **CSV import errors:** Check that all location values in your CSV match the valid options exactly (case-sensitive)