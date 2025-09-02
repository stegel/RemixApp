-- Migration Script: Convert from name-required to team_number-required schema
-- Run this if you already have the database set up and want to make these changes
-- Also includes previous migrations for location constraints and scoring conversion

-- PART 1: SCHEMA CHANGES (Team Number Required, Name Optional)

-- Step 1: Add team_number column if it doesn't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_number INTEGER;

-- Step 2: Add location column if it doesn't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Step 3: Remove old columns that are no longer needed
ALTER TABLE teams DROP COLUMN IF EXISTS description;
ALTER TABLE teams DROP COLUMN IF EXISTS presentation_order;
DROP INDEX IF EXISTS idx_teams_presentation_order;

-- Step 4: Update existing teams with sequential team numbers if they don't have them
-- This will assign team numbers starting from 1, ordered by name (with nulls last)
DO $$
DECLARE
    team_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR team_record IN 
        SELECT id FROM teams WHERE team_number IS NULL ORDER BY name NULLS LAST, id
    LOOP
        UPDATE teams SET team_number = counter WHERE id = team_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Step 5: Add NOT NULL constraint to team_number after all teams have numbers
ALTER TABLE teams ALTER COLUMN team_number SET NOT NULL;

-- Step 6: Create unique constraint on team_number if it doesn't exist
DO $$
BEGIN
    -- Add unique constraint only if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teams_team_number_key' 
        AND table_name = 'teams'
    ) THEN
        ALTER TABLE teams ADD CONSTRAINT teams_team_number_key UNIQUE (team_number);
    END IF;
END $$;

-- Step 7: Remove NOT NULL constraint from name column (make it optional)
ALTER TABLE teams ALTER COLUMN name DROP NOT NULL;

-- Step 8: Create index for team_number if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_teams_team_number ON teams(team_number);

-- Step 9: Add location constraint
-- First update any invalid location values to NULL
UPDATE teams SET location = NULL WHERE location IS NOT NULL AND location NOT IN ('Americas', 'Amsterdam', 'Hyderabad');

-- Add the constraint
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_location_check;
ALTER TABLE teams ADD CONSTRAINT teams_location_check CHECK (location IS NULL OR location IN ('Americas', 'Amsterdam', 'Hyderabad'));

-- Step 10: Update column comments
COMMENT ON COLUMN teams.team_number IS 'Required unique team number for identification';
COMMENT ON COLUMN teams.name IS 'Optional unique name of the team';
COMMENT ON COLUMN teams.location IS 'Team location (Americas, Amsterdam, or Hyderabad)';

-- PART 2: SCORING SYSTEM MIGRATION (Convert from 1-5 scale to 0-4 scale)
-- Run the sections below ONLY if you have existing evaluation data that needs to be converted
-- WARNING: This will modify your existing data. Make sure to backup first!

-- Step 1: Convert existing scores from 1-5 scale to 0-4 scale
-- This subtracts 1 from each score to shift from (1,2,3,4,5) to (0,1,2,3,4)
UPDATE evaluations SET
    curiosity_score = curiosity_score - 1,
    experimentation_score = experimentation_score - 1,
    learning_score = learning_score - 1,
    innovation_score = innovation_score - 1,
    collaboration_score = collaboration_score - 1
WHERE 
    curiosity_score >= 1 AND curiosity_score <= 5
    AND experimentation_score >= 1 AND experimentation_score <= 5
    AND learning_score >= 1 AND learning_score <= 5
    AND innovation_score >= 1 AND innovation_score <= 5
    AND collaboration_score >= 1 AND collaboration_score <= 5;

-- Step 2: Update the CHECK constraints to enforce 0-4 range
-- Remove old constraints
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_curiosity_score_check;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_experimentation_score_check;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_learning_score_check;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_innovation_score_check;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_collaboration_score_check;

-- Add new constraints for 0-4 range
ALTER TABLE evaluations ADD CONSTRAINT evaluations_curiosity_score_check 
    CHECK (curiosity_score >= 0 AND curiosity_score <= 4);
ALTER TABLE evaluations ADD CONSTRAINT evaluations_experimentation_score_check 
    CHECK (experimentation_score >= 0 AND experimentation_score <= 4);
ALTER TABLE evaluations ADD CONSTRAINT evaluations_learning_score_check 
    CHECK (learning_score >= 0 AND learning_score <= 4);
ALTER TABLE evaluations ADD CONSTRAINT evaluations_innovation_score_check 
    CHECK (innovation_score >= 0 AND innovation_score <= 4);
ALTER TABLE evaluations ADD CONSTRAINT evaluations_collaboration_score_check 
    CHECK (collaboration_score >= 0 AND collaboration_score <= 4);

-- Step 3: Update evaluation column comments
COMMENT ON COLUMN evaluations.curiosity_score IS 'Score for team curiosity (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';
COMMENT ON COLUMN evaluations.experimentation_score IS 'Score for team experimentation (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';
COMMENT ON COLUMN evaluations.learning_score IS 'Score for learning provided to judge (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';
COMMENT ON COLUMN evaluations.innovation_score IS 'Score for innovative tool usage (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';
COMMENT ON COLUMN evaluations.collaboration_score IS 'Score for team collaboration (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';

-- Step 4: Verify the migration completed successfully
SELECT 
    'Migration Verification' as status,
    COUNT(*) as total_teams,
    COUNT(CASE WHEN team_number IS NOT NULL THEN 1 END) as teams_with_numbers,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as teams_with_names,
    COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as teams_with_locations
FROM teams;

-- Verify scoring migration (if you have evaluation data)
SELECT 
    'Scoring Verification' as status,
    COUNT(*) as total_evaluations,
    MIN(curiosity_score) as min_curiosity,
    MAX(curiosity_score) as max_curiosity,
    MIN(experimentation_score) as min_experimentation, 
    MAX(experimentation_score) as max_experimentation,
    MIN(learning_score) as min_learning,
    MAX(learning_score) as max_learning,
    MIN(innovation_score) as min_innovation,
    MAX(innovation_score) as max_innovation,
    MIN(collaboration_score) as min_collaboration,
    MAX(collaboration_score) as max_collaboration
FROM evaluations;

-- The above query should show:
-- - All teams should have team_number (teams_with_numbers = total_teams)
-- - All minimum scores should be >= 0
-- - All maximum scores should be <= 4

COMMENT ON EXTENSION IF EXISTS plpgsql IS 'Migration completed: Schema updated to team_number-required model with 0-4 scoring scale';