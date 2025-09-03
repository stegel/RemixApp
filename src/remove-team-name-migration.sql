-- Migration: Remove team_name column from evaluations table
-- This migration removes the legacy team_name column after successful team_id migration
-- IMPORTANT: Only run this after verifying all evaluations have team_id assigned

-- Pre-migration verification
DO $$
DECLARE
    total_evaluations INTEGER;
    evaluations_with_team_id INTEGER;
    evaluations_without_team_id INTEGER;
    success_rate NUMERIC;
BEGIN
    -- Count total evaluations
    SELECT COUNT(*) INTO total_evaluations FROM evaluations;
    
    -- Count evaluations with team_id
    SELECT COUNT(*) INTO evaluations_with_team_id FROM evaluations WHERE team_id IS NOT NULL;
    
    -- Count evaluations without team_id
    evaluations_without_team_id := total_evaluations - evaluations_with_team_id;
    
    -- Calculate success rate
    IF total_evaluations > 0 THEN
        success_rate := (evaluations_with_team_id::numeric / total_evaluations) * 100;
    ELSE
        success_rate := 100;
    END IF;
    
    RAISE NOTICE '=== PRE-MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Total evaluations: %', total_evaluations;
    RAISE NOTICE 'Evaluations with team_id: %', evaluations_with_team_id;
    RAISE NOTICE 'Evaluations without team_id: %', evaluations_without_team_id;
    RAISE NOTICE 'Migration success rate: %%%', ROUND(success_rate, 2);
    
    -- Stop migration if not all evaluations have team_id
    IF evaluations_without_team_id > 0 THEN
        RAISE EXCEPTION 'MIGRATION BLOCKED: % evaluations still missing team_id. Please run team_id migration first.', evaluations_without_team_id;
    END IF;
    
    RAISE NOTICE 'Verification passed - safe to proceed with team_name column removal';
    RAISE NOTICE '===================================';
END $$;

-- Step 1: Ensure team_id has NOT NULL constraint
-- This is critical for data integrity before removing team_name
ALTER TABLE evaluations ALTER COLUMN team_id SET NOT NULL;

-- Step 2: Add foreign key constraint if not already present
-- This ensures referential integrity
DO $$
BEGIN
    -- Check if foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_evaluations_team_id'
        AND table_name = 'evaluations'
    ) THEN
        ALTER TABLE evaluations 
        ADD CONSTRAINT fk_evaluations_team_id 
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint fk_evaluations_team_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_evaluations_team_id already exists';
    END IF;
END $$;

-- Step 3: Remove the legacy team_name index
DROP INDEX IF EXISTS idx_evaluations_team_name;
RAISE NOTICE 'Removed legacy index idx_evaluations_team_name';

-- Step 4: Update any views that might still reference team_name
-- Note: Our team_analytics view should already be updated to use team_id

-- Step 5: Remove the team_name column
ALTER TABLE evaluations DROP COLUMN IF EXISTS team_name;
RAISE NOTICE 'Removed team_name column from evaluations table';

-- Step 6: Update table comments to reflect the changes
COMMENT ON TABLE evaluations IS 'Stores team evaluation data from the AI in The Mix experience simulation judging form. Uses team_id foreign key for team relationships.';
COMMENT ON COLUMN evaluations.team_id IS 'Foreign key reference to teams.id for the team being evaluated';

-- Step 7: Verify the migration
DO $$
DECLARE
    column_exists BOOLEAN;
    fk_exists BOOLEAN;
    total_evaluations INTEGER;
BEGIN
    -- Check if team_name column still exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'evaluations' 
        AND column_name = 'team_name'
    ) INTO column_exists;
    
    -- Check if foreign key constraint exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_evaluations_team_id'
        AND table_name = 'evaluations'
    ) INTO fk_exists;
    
    -- Count total evaluations
    SELECT COUNT(*) INTO total_evaluations FROM evaluations;
    
    RAISE NOTICE '=== POST-MIGRATION VERIFICATION ===';
    RAISE NOTICE 'team_name column exists: %', column_exists;
    RAISE NOTICE 'Foreign key constraint exists: %', fk_exists;
    RAISE NOTICE 'Total evaluations preserved: %', total_evaluations;
    
    IF column_exists THEN
        RAISE WARNING 'team_name column still exists - migration may have failed';
    ELSE
        RAISE NOTICE 'team_name column successfully removed';
    END IF;
    
    IF NOT fk_exists THEN
        RAISE WARNING 'Foreign key constraint missing - data integrity at risk';
    ELSE
        RAISE NOTICE 'Foreign key constraint in place - data integrity ensured';
    END IF;
    
    RAISE NOTICE '===================================';
END $$;

-- Step 8: Create a function to get team name from team_id for backward compatibility
CREATE OR REPLACE FUNCTION get_team_name_by_id(team_id_param INTEGER)
RETURNS VARCHAR(255) AS $$
DECLARE
    team_name VARCHAR(255);
BEGIN
    SELECT 
        COALESCE(t.name, 'Team ' || t.team_number, 'Team #' || t.id)
    INTO team_name
    FROM teams t
    WHERE t.id = team_id_param;
    
    RETURN COALESCE(team_name, 'Unknown Team');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_team_name_by_id(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_team_name_by_id(INTEGER) TO authenticated;

-- Step 9: Create a view that includes team names for easier querying
CREATE OR REPLACE VIEW evaluations_with_team_names AS
SELECT 
    e.id,
    e.participant_name,
    e.team_id,
    COALESCE(t.name, 'Team ' || t.team_number, 'Team #' || t.id) as team_name,
    t.location as team_location,
    e.curiosity_score,
    e.experimentation_score,
    e.learning_score,
    e.innovation_score,
    e.collaboration_score,
    e.created_at,
    e.updated_at
FROM evaluations e
JOIN teams t ON e.team_id = t.id;

-- Grant permissions on the new view
GRANT SELECT ON evaluations_with_team_names TO anon;
GRANT SELECT ON evaluations_with_team_names TO authenticated;

-- Step 10: Update existing functions that might use team_name
CREATE OR REPLACE FUNCTION get_evaluation_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_evaluations', (SELECT COUNT(*) FROM evaluations),
        'total_teams', (SELECT COUNT(DISTINCT team_id) FROM evaluations),
        'total_participants', (SELECT COUNT(DISTINCT participant_name) FROM evaluations),
        'average_overall_score', (
            SELECT ROUND(AVG((curiosity_score + experimentation_score + learning_score + innovation_score + collaboration_score)::numeric / 5), 2) 
            FROM evaluations
        ),
        'latest_evaluation', (SELECT created_at FROM evaluations ORDER BY created_at DESC LIMIT 1)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final migration summary
DO $$
DECLARE
    total_evaluations INTEGER;
    total_teams_with_evaluations INTEGER;
    avg_evaluations_per_team NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_evaluations FROM evaluations;
    SELECT COUNT(DISTINCT team_id) INTO total_teams_with_evaluations FROM evaluations;
    
    IF total_teams_with_evaluations > 0 THEN
        avg_evaluations_per_team := total_evaluations::numeric / total_teams_with_evaluations;
    ELSE
        avg_evaluations_per_team := 0;
    END IF;
    
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'team_name column removed from evaluations table';
    RAISE NOTICE 'All evaluations now use team_id foreign key relationships';
    RAISE NOTICE 'Total evaluations: %', total_evaluations;
    RAISE NOTICE 'Teams with evaluations: %', total_teams_with_evaluations;
    RAISE NOTICE 'Average evaluations per team: %', ROUND(avg_evaluations_per_team, 2);
    RAISE NOTICE 'Data integrity enforced with foreign key constraints';
    RAISE NOTICE 'Backward compatibility maintained with helper functions';
    RAISE NOTICE '========================================';
END $$;