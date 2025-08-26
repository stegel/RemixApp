# Team Structure Update: Adding Team Numbers

## Database Changes Required

The team structure has been updated to support both team numbers (required) and team names (optional). The following database changes need to be made:

### 1. Update Teams Table Schema

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Add team_number column to teams table
ALTER TABLE teams ADD COLUMN team_number INTEGER NOT NULL DEFAULT 1;

-- Add team_name column (renaming existing name column)  
ALTER TABLE teams ADD COLUMN team_name VARCHAR(255);

-- Copy existing names to team_name column
UPDATE teams SET team_name = name;

-- Drop the old name column
ALTER TABLE teams DROP COLUMN name;

-- Add unique constraint on team_number
ALTER TABLE teams ADD CONSTRAINT teams_team_number_unique UNIQUE (team_number);

-- Update the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Update Existing Team Data (Optional)

If you want to convert existing team names to numbers:

```sql
-- Example: Convert "Team Alpha" to team_number=1, team_name="Alpha"
-- Adjust as needed for your data

-- Option 1: Keep existing names as team_name, assign sequential numbers
WITH numbered_teams AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM teams
)
UPDATE teams 
SET team_number = numbered_teams.row_num
FROM numbered_teams 
WHERE teams.id = numbered_teams.id;

-- Option 2: Extract numbers from existing names (if they follow "Team X" pattern)
-- UPDATE teams SET team_number = CAST(REGEXP_REPLACE(team_name, '^Team ', '') AS INTEGER)
-- WHERE team_name ~ '^Team [0-9]+$';
```

## Application Behavior

### Display Logic
- **With Team Name**: Shows the team name (e.g., "Alpha Squad")
- **Without Team Name**: Shows "Team {number}" (e.g., "Team 5")

### Admin Interface
- Can create teams with number (required) and name (optional)
- Can edit both team number and name
- Prevents duplicate numbers or names

### Judging Form
- Shows teams using the display logic above
- Submits evaluations using the display name

### Results Dashboard
- All displays use the same display logic
- Rankings and statistics work with display names

## Migration Steps

1. **Backup your database** before making changes
2. Execute the SQL schema changes above
3. Update any existing team data as needed
4. Test the application with the new team structure
5. The application code has already been updated to handle the new structure

## Notes

- Team numbers must be unique and greater than 0
- Team names are optional but if provided, must be unique
- All existing functionality continues to work
- The change is backward compatible with existing evaluation data