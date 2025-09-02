-- AI in The Mix: Experience Simulation Database Schema
-- Run this script in your Supabase SQL Editor to create all necessary tables and policies

-- Create the teams table first
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    team_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(255) UNIQUE,
    location VARCHAR(255) CHECK (location IN ('Americas', 'Amsterdam', 'Hyderabad')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create the evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    participant_name VARCHAR(255) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    curiosity_score INTEGER NOT NULL CHECK (curiosity_score >= 0 AND curiosity_score <= 4),
    experimentation_score INTEGER NOT NULL CHECK (experimentation_score >= 0 AND experimentation_score <= 4),
    learning_score INTEGER NOT NULL CHECK (learning_score >= 0 AND learning_score <= 4),
    innovation_score INTEGER NOT NULL CHECK (innovation_score >= 0 AND innovation_score <= 4),
    collaboration_score INTEGER NOT NULL CHECK (collaboration_score >= 0 AND collaboration_score <= 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for teams table
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active);
CREATE INDEX IF NOT EXISTS idx_teams_team_number ON teams(team_number);

-- Create indexes for better query performance on evaluations
CREATE INDEX IF NOT EXISTS idx_evaluations_team_name ON evaluations(team_name);
CREATE INDEX IF NOT EXISTS idx_evaluations_participant_name ON evaluations(participant_name);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_scores ON evaluations(curiosity_score, experimentation_score, learning_score, innovation_score, collaboration_score);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE 'plpgsql';

-- Create triggers to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluations_updated_at ON evaluations;
CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security on teams table
CREATE POLICY "Service role can do everything on teams" ON teams
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow anonymous read access to teams" ON teams
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users full access to teams" ON teams
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for Row Level Security on evaluations table
CREATE POLICY "Service role can do everything on evaluations" ON evaluations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow anonymous read access to evaluations" ON evaluations
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access to evaluations" ON evaluations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to evaluations" ON evaluations
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a view for team analytics (optional - makes queries easier)
CREATE OR REPLACE VIEW team_analytics AS
SELECT 
    team_name,
    COUNT(*) as evaluation_count,
    ROUND(AVG(curiosity_score::numeric), 2) as avg_curiosity,
    ROUND(AVG(experimentation_score::numeric), 2) as avg_experimentation,
    ROUND(AVG(learning_score::numeric), 2) as avg_learning,
    ROUND(AVG(innovation_score::numeric), 2) as avg_innovation,
    ROUND(AVG(collaboration_score::numeric), 2) as avg_collaboration,
    ROUND(AVG((curiosity_score + experimentation_score + learning_score + innovation_score + collaboration_score)::numeric / 5), 2) as avg_overall
FROM evaluations
GROUP BY team_name
ORDER BY avg_overall DESC, evaluation_count DESC;

-- Create a function to get evaluation statistics
CREATE OR REPLACE FUNCTION get_evaluation_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_evaluations', (SELECT COUNT(*) FROM evaluations),
        'total_teams', (SELECT COUNT(DISTINCT team_name) FROM evaluations),
        'total_participants', (SELECT COUNT(DISTINCT participant_name) FROM evaluations),
        'average_overall_score', (SELECT ROUND(AVG((curiosity_score + experimentation_score + learning_score + innovation_score + collaboration_score)::numeric / 5), 2) FROM evaluations),
        'latest_evaluation', (SELECT created_at FROM evaluations ORDER BY created_at DESC LIMIT 1)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get team rankings
CREATE OR REPLACE FUNCTION get_team_rankings()
RETURNS TABLE (
    rank INTEGER,
    team_name VARCHAR(255),
    evaluation_count BIGINT,
    avg_overall_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY AVG((e.curiosity_score + e.experimentation_score + e.learning_score + e.innovation_score + e.collaboration_score)::numeric / 5) DESC)::INTEGER as rank,
        e.team_name,
        COUNT(*)::BIGINT as evaluation_count,
        ROUND(AVG((e.curiosity_score + e.experimentation_score + e.learning_score + e.innovation_score + e.collaboration_score)::numeric / 5), 2) as avg_overall_score
    FROM evaluations e
    GROUP BY e.team_name
    HAVING COUNT(*) >= 3  -- Only include teams with at least 3 evaluations
    ORDER BY avg_overall_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON teams TO anon;
GRANT ALL ON teams TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE teams_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE teams_id_seq TO authenticated;

GRANT ALL ON evaluations TO anon;
GRANT ALL ON evaluations TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE evaluations_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE evaluations_id_seq TO authenticated;

-- Grant permissions on the view and functions
GRANT SELECT ON team_analytics TO anon;
GRANT SELECT ON team_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_evaluation_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_evaluation_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_rankings() TO anon;
GRANT EXECUTE ON FUNCTION get_team_rankings() TO authenticated;

-- Insert some sample data (optional - remove if you don't want sample data)
-- Uncomment the following lines if you want to start with sample teams and evaluations

/*
-- Sample teams
INSERT INTO teams (team_number, name, location, is_active) VALUES
(1, 'Engineering Team', 'Americas', true),
(2, 'Design Team', 'Amsterdam', true),
(3, 'Product Management', 'Hyderabad', true),
(4, 'Data Science', 'Americas', true),
(5, 'Customer Success', 'Amsterdam', true),
(6, 'Sales Team', 'Hyderabad', true),
(7, 'Marketing Team', 'Americas', true),
(8, 'Operations', 'Amsterdam', true),
(9, 'QA/Testing', 'Hyderabad', true),
(10, 'DevOps', 'Americas', true);

-- Sample evaluations (using 0-4 scale)
INSERT INTO evaluations (participant_name, team_name, curiosity_score, experimentation_score, learning_score, innovation_score, collaboration_score) VALUES
('John Doe', 'Engineering Team', 3, 4, 3, 2, 4),
('Jane Smith', 'Engineering Team', 4, 3, 4, 3, 3),
('Bob Johnson', 'Engineering Team', 2, 3, 2, 3, 3),
('Alice Brown', 'Design Team', 4, 2, 3, 4, 4),
('Charlie Wilson', 'Design Team', 3, 3, 4, 3, 2),
('Diana Davis', 'Design Team', 2, 4, 2, 2, 3),
('Frank Miller', 'Product Management', 3, 2, 3, 3, 4),
('Grace Lee', 'Product Management', 4, 4, 2, 2, 3),
('Henry Clark', 'Product Management', 2, 3, 4, 3, 2);
*/

-- Create helpful comments
COMMENT ON TABLE teams IS 'Stores team information for the AI in The Mix experience simulation';
COMMENT ON COLUMN teams.team_number IS 'Required unique team number for identification';
COMMENT ON COLUMN teams.name IS 'Optional unique name of the team';
COMMENT ON COLUMN teams.location IS 'Team location (Americas, Amsterdam, or Hyderabad)';
COMMENT ON COLUMN teams.is_active IS 'Whether the team is actively participating';

COMMENT ON TABLE evaluations IS 'Stores team evaluation data from the AI in The Mix experience simulation judging form';
COMMENT ON COLUMN evaluations.participant_name IS 'Name of the person submitting the evaluation';
COMMENT ON COLUMN evaluations.team_name IS 'Name of the team being evaluated';
COMMENT ON COLUMN evaluations.curiosity_score IS 'Score for team curiosity (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';
COMMENT ON COLUMN evaluations.experimentation_score IS 'Score for team experimentation (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';
COMMENT ON COLUMN evaluations.learning_score IS 'Score for learning provided to judge (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';
COMMENT ON COLUMN evaluations.innovation_score IS 'Score for innovative tool usage (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';
COMMENT ON COLUMN evaluations.collaboration_score IS 'Score for team collaboration (0-4 scale: 0=Strongly Disagree, 4=Strongly Agree)';