import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle, Database, ExternalLink } from "lucide-react";
import { Badge } from "./ui/badge";

interface DatabaseMigrationNoticeProps {
  onDismiss: () => void;
}

export function DatabaseMigrationNotice({ onDismiss }: DatabaseMigrationNoticeProps) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <CardTitle className="text-amber-800 dark:text-amber-200">Database Migration Required</CardTitle>
          <Badge variant="outline" className="text-amber-700 border-amber-300">
            Legacy Mode
          </Badge>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          The application is running in compatibility mode with the old team structure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <p className="mb-3">
            <strong>Current Status:</strong> Teams are managed using the legacy "name" field. 
            The new team number and optional name features are available in the UI but not fully functional.
          </p>
          
          <div className="space-y-2">
            <p><strong>To enable full functionality:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Open your Supabase SQL Editor</li>
              <li>Run the migration script from <code>TEAM_STRUCTURE_UPDATE.md</code></li>
              <li>Refresh this application</li>
            </ol>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2 text-xs text-amber-600">
            <Database className="w-4 h-4" />
            <span>Using legacy schema compatibility</span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const content = `# Team Structure Update: Adding Team Numbers

## Database Changes Required

The team structure has been updated to support both team numbers (required) and team names (optional). The following database changes need to be made:

### 1. Update Teams Table Schema

Execute the following SQL in your Supabase SQL Editor:

\`\`\`sql
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
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
\`\`\`

### 2. Update Existing Team Data (Optional)

If you want to convert existing team names to numbers:

\`\`\`sql
-- Assign sequential numbers to existing teams
WITH numbered_teams AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM teams
)
UPDATE teams 
SET team_number = numbered_teams.row_num
FROM numbered_teams 
WHERE teams.id = numbered_teams.id;
\`\`\`

## Application Behavior

### Display Logic
- **With Team Name**: Shows the team name (e.g., "Alpha Squad")
- **Without Team Name**: Shows "Team {number}" (e.g., "Team 5")

### Migration Steps

1. **Backup your database** before making changes
2. Execute the SQL schema changes above
3. Update any existing team data as needed
4. Test the application with the new team structure
5. The application code has already been updated to handle the new structure

## Notes

- Team numbers must be unique and greater than 0
- Team names are optional but if provided, must be unique
- All existing functionality continues to work
- The change is backward compatible with existing evaluation data`;
                
                const blob = new Blob([content], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'TEAM_STRUCTURE_UPDATE.md';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Download Migration Guide
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDismiss}
              className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}