-- Migration: Update evaluations table to use team_id instead of team_name
-- This migration adds team_id foreign key and migrates existing data

-- Step 1: Add team_id column to evaluations table
ALTER TABLE evaluations ADD COLUMN team_id INTEGER;

-- Step 2: Create foreign key constraint (but don't enforce it yet for existing data)
-- We'll add the constraint after data migration
-- ALTER TABLE evaluations ADD CONSTRAINT fk_evaluations_team_id 
--   FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Step 3: Update existing evaluations to set team_id based on team_name
-- This assumes team names in evaluations match team names in the teams table
UPDATE evaluations 
SET team_id = teams.id 
FROM teams 
WHERE evaluations.team_name = teams.name;

-- Step 4: Update evaluations that don't have matching team names 
-- For evaluations where team_name doesn't match any team.name, 
-- try to match by team number format (e.g., "Team 1" -> team_number = 1)
UPDATE evaluations 
SET team_id = teams.id 
FROM teams 
WHERE evaluations.team_id IS NULL 
AND evaluations.team_name ~ '^Team \d+$'
AND teams.team_number = CAST(SUBSTRING(evaluations.team_name FROM 'Team (\d+)') AS INTEGER);

-- Step 5: For any remaining unmatched evaluations, create teams if they don't exist
-- This handles cases where team names in evaluations don't exist in teams table
DO $$
DECLARE
    eval_rec RECORD;
    new_team_id INTEGER;
BEGIN
    FOR eval_rec IN 
        SELECT DISTINCT team_name 
        FROM evaluations 
        WHERE team_id IS NULL 
        AND team_name IS NOT NULL 
        AND team_name != ''
    LOOP
        -- Check if team exists by name
        SELECT id INTO new_team_id 
        FROM teams 
        WHERE name = eval_rec.team_name;
        
        -- If team doesn't exist, create it
        IF new_team_id IS NULL THEN
            INSERT INTO teams (name, is_active) 
            VALUES (eval_rec.team_name, true)
            RETURNING id INTO new_team_id;
            
            RAISE NOTICE 'Created new team: % (ID: %)', eval_rec.team_name, new_team_id;
        END IF;
        
        -- Update evaluations with the team_id
        UPDATE evaluations 
        SET team_id = new_team_id 
        WHERE team_name = eval_rec.team_name 
        AND team_id IS NULL;
    END LOOP;
END $$;

-- Step 6: Check for any evaluations that still don't have team_id
-- These would need manual intervention
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count 
    FROM evaluations 
    WHERE team_id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'Found % evaluations without team_id. These need manual review:', orphan_count;
        
        -- Log the problematic evaluations
        RAISE NOTICE 'Evaluations without team_id:';
        FOR rec IN 
            SELECT id, participant_name, team_name 
            FROM evaluations 
            WHERE team_id IS NULL 
            LIMIT 10
        LOOP
            RAISE NOTICE 'ID: %, Participant: %, Team Name: "%"', rec.id, rec.participant_name, rec.team_name;
        END LOOP;
    ELSE
        RAISE NOTICE 'All evaluations successfully assigned team_id';
    END IF;
END $$;

-- Step 7: Add NOT NULL constraint to team_id (only if all evaluations have team_id)
-- Uncomment after verifying all data is migrated
-- ALTER TABLE evaluations ALTER COLUMN team_id SET NOT NULL;

-- Step 8: Add foreign key constraint
-- Uncomment after verifying all data is migrated and team_id is NOT NULL
-- ALTER TABLE evaluations ADD CONSTRAINT fk_evaluations_team_id 
--   FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Step 9: Create new index for team_id (replacing team_name index)
CREATE INDEX IF NOT EXISTS idx_evaluations_team_id ON evaluations(team_id);

-- Step 10: Update the analytics view to use team_id and join with teams
DROP VIEW IF EXISTS team_analytics;
CREATE OR REPLACE VIEW team_analytics AS
SELECT 
    t.name as team_name,
    t.location,
    COUNT(e.id) as evaluation_count,
    ROUND(AVG(e.curiosity_score::numeric), 2) as avg_curiosity,
    ROUND(AVG(e.experimentation_score::numeric), 2) as avg_experimentation,
    ROUND(AVG(e.learning_score::numeric), 2) as avg_learning,
    ROUND(AVG(e.innovation_score::numeric), 2) as avg_innovation,
    ROUND(AVG(e.collaboration_score::numeric), 2) as avg_collaboration,
    ROUND(AVG((e.curiosity_score + e.experimentation_score + e.learning_score + e.innovation_score + e.collaboration_score)::numeric / 5), 2) as avg_overall
FROM teams t
LEFT JOIN evaluations e ON t.id = e.team_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.location
HAVING COUNT(e.id) > 0  -- Only include teams with evaluations
ORDER BY avg_overall DESC, evaluation_count DESC;

-- Step 11: Update functions to use team_id
CREATE OR REPLACE FUNCTION get_evaluation_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_evaluations', (SELECT COUNT(*) FROM evaluations),
        'total_teams', (SELECT COUNT(DISTINCT team_id) FROM evaluations WHERE team_id IS NOT NULL),
        'total_participants', (SELECT COUNT(DISTINCT participant_name) FROM evaluations),
        'average_overall_score', (
            SELECT ROUND(AVG((curiosity_score + experimentation_score + learning_score + innovation_score + collaboration_score)::numeric / 5), 2) 
            FROM evaluations 
            WHERE team_id IS NOT NULL
        ),
        'latest_evaluation', (SELECT created_at FROM evaluations ORDER BY created_at DESC LIMIT 1)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_team_rankings()
RETURNS TABLE (
    rank INTEGER,
    team_id INTEGER,
    team_name VARCHAR(255),
    team_location VARCHAR(255),
    evaluation_count BIGINT,
    avg_overall_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY AVG((e.curiosity_score + e.experimentation_score + e.learning_score + e.innovation_score + e.collaboration_score)::numeric / 5) DESC)::INTEGER as rank,
        t.id,
        t.name,
        t.location,
        COUNT(e.id)::BIGINT as evaluation_count,
        ROUND(AVG((e.curiosity_score + e.experimentation_score + e.learning_score + e.innovation_score + e.collaboration_score)::numeric / 5), 2) as avg_overall_score
    FROM teams t
    JOIN evaluations e ON t.id = e.team_id
    WHERE t.is_active = true
    GROUP BY t.id, t.name, t.location
    HAVING COUNT(e.id) >= 3  -- Only include teams with at least 3 evaluations
    ORDER BY avg_overall_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Add helpful comments
COMMENT ON COLUMN evaluations.team_id IS 'Foreign key reference to teams.id for the team being evaluated';
COMMENT ON COLUMN evaluations.team_name IS 'DEPRECATED: Legacy team name field, use team_id instead. Will be removed in future version.';

-- Migration completion summary
DO $$
DECLARE
    total_evaluations INTEGER;
    migrated_evaluations INTEGER;
    teams_with_evaluations INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_evaluations FROM evaluations;
    SELECT COUNT(*) INTO migrated_evaluations FROM evaluations WHERE team_id IS NOT NULL;
    SELECT COUNT(DISTINCT team_id) INTO teams_with_evaluations FROM evaluations WHERE team_id IS NOT NULL;
    
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Total evaluations: %', total_evaluations;
    RAISE NOTICE 'Successfully migrated: %', migrated_evaluations;
    RAISE NOTICE 'Migration success rate: %%%', ROUND((migrated_evaluations::numeric / total_evaluations * 100), 2);
    RAISE NOTICE 'Teams with evaluations: %', teams_with_evaluations;
    RAISE NOTICE '========================';
END $$;