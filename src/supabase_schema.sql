-- Supabase Schema for Experience Simulation Judging System
-- Run this in the Supabase SQL Editor to create the required tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table (optional - for future extensibility)
-- Currently the app just uses team names as strings, but this allows for additional metadata
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judges table (optional - for future extensibility)  
-- Currently the app just uses judge names as strings, but this allows for additional metadata
CREATE TABLE judges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main evaluations table
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(255) NOT NULL,
    judge_name VARCHAR(255) NOT NULL,
    
    -- Core evaluation scores
    solution_description INTEGER NOT NULL CHECK (solution_description IN (1, 2, 3)), -- 1=Basic, 2=Thoughtful, 3=Extraordinary
    ex_roles_contribution INTEGER NOT NULL CHECK (ex_roles_contribution IN (1, 2, 3)), -- 1=Basic, 2=Thoughtful, 3=Extraordinary
    learned_new_technique BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Comments
    comments TEXT DEFAULT '',
    
    -- Calculated scores (will be computed from AI tool scores)
    ai_tools_total INTEGER NOT NULL DEFAULT 0,
    ai_tools_average DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    total_score DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for evaluations table
CREATE INDEX idx_evaluations_team_name ON evaluations(team_name);
CREATE INDEX idx_evaluations_judge_name ON evaluations(judge_name);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at);
CREATE INDEX idx_evaluations_total_score ON evaluations(total_score);

-- AI Tool Categories enum (for reference and validation)
DO $$ BEGIN
    CREATE TYPE ai_tool_category AS ENUM (
        'synthesizing_research',
        'reviewing_transcripts', 
        'service_blueprint_journey_map',
        'summarize_product_docs',
        'generate_design_concepts',
        'generate_messaging_ui',
        'updating_ui_copy',
        'generate_research_plan',
        'drafting_product_docs',
        'generate_multimedia_content',
        'create_release_posts'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AI tool scores table (normalized for better querying and aggregation)
CREATE TABLE ai_tool_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    tool_category ai_tool_category NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 3), -- 0=Did not use, 3=Exemplary usage
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate scores for same evaluation/tool
    UNIQUE(evaluation_id, tool_category)
);

-- Create indexes for ai_tool_scores table
CREATE INDEX idx_ai_tool_scores_evaluation_id ON ai_tool_scores(evaluation_id);
CREATE INDEX idx_ai_tool_scores_tool_category ON ai_tool_scores(tool_category);
CREATE INDEX idx_ai_tool_scores_score ON ai_tool_scores(score);

-- Function to update calculated scores when AI tool scores change
CREATE OR REPLACE FUNCTION update_evaluation_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the calculated scores for the evaluation
    UPDATE evaluations 
    SET 
        ai_tools_total = (
            SELECT COALESCE(SUM(score), 0) 
            FROM ai_tool_scores 
            WHERE evaluation_id = COALESCE(NEW.evaluation_id, OLD.evaluation_id)
        ),
        ai_tools_average = (
            SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0) 
            FROM ai_tool_scores 
            WHERE evaluation_id = COALESCE(NEW.evaluation_id, OLD.evaluation_id)
        ),
        total_score = (
            SELECT 
                COALESCE(SUM(ats.score), 0) + 
                e.solution_description + 
                e.ex_roles_contribution
            FROM evaluations e
            LEFT JOIN ai_tool_scores ats ON ats.evaluation_id = e.id
            WHERE e.id = COALESCE(NEW.evaluation_id, OLD.evaluation_id)
            GROUP BY e.id, e.solution_description, e.ex_roles_contribution
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.evaluation_id, OLD.evaluation_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update calculated scores
CREATE TRIGGER trigger_update_evaluation_scores_on_insert
    AFTER INSERT ON ai_tool_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluation_scores();

CREATE TRIGGER trigger_update_evaluation_scores_on_update
    AFTER UPDATE ON ai_tool_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluation_scores();

CREATE TRIGGER trigger_update_evaluation_scores_on_delete
    AFTER DELETE ON ai_tool_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluation_scores();

-- Function to update evaluation scores when core scores change
CREATE OR REPLACE FUNCTION update_evaluation_total_on_core_change()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_score = (
        SELECT COALESCE(SUM(score), 0) 
        FROM ai_tool_scores 
        WHERE evaluation_id = NEW.id
    ) + NEW.solution_description + NEW.ex_roles_contribution;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for when core evaluation scores change
CREATE TRIGGER trigger_update_total_on_core_change
    BEFORE UPDATE OF solution_description, ex_roles_contribution ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluation_total_on_core_change();

-- Views for easier querying

-- Team summary view (replaces the team summary API logic)
CREATE VIEW team_summaries AS
SELECT 
    e.team_name,
    COUNT(e.id) as evaluation_count,
    
    -- Average scores
    ROUND(AVG(e.ai_tools_total)::numeric, 2) as avg_ai_tools_total,
    ROUND(AVG(e.ai_tools_average)::numeric, 2) as avg_ai_tools_average,
    ROUND(AVG(e.solution_description)::numeric, 2) as avg_solution_description,
    ROUND(AVG(e.ex_roles_contribution)::numeric, 2) as avg_ex_roles_contribution,
    ROUND(AVG(e.total_score)::numeric, 2) as avg_total_score,
    
    -- Learning statistics
    COUNT(CASE WHEN e.learned_new_technique = TRUE THEN 1 END) as learned_new_technique_count,
    ROUND(
        (COUNT(CASE WHEN e.learned_new_technique = TRUE THEN 1 END)::numeric / COUNT(e.id)::numeric * 100), 
        1
    ) as learned_new_technique_percentage,
    
    -- Metadata
    MIN(e.created_at) as first_evaluation_at,
    MAX(e.created_at) as last_evaluation_at
    
FROM evaluations e
GROUP BY e.team_name
ORDER BY avg_total_score DESC;

-- AI tool category averages by team
CREATE VIEW team_ai_tool_averages AS
SELECT 
    e.team_name,
    ats.tool_category,
    ROUND(AVG(ats.score)::numeric, 2) as avg_score,
    COUNT(ats.score) as evaluation_count
FROM evaluations e
JOIN ai_tool_scores ats ON ats.evaluation_id = e.id
GROUP BY e.team_name, ats.tool_category
ORDER BY e.team_name, ats.tool_category;

-- Overall AI tool category statistics
CREATE VIEW ai_tool_category_stats AS
SELECT 
    ats.tool_category,
    COUNT(ats.id) as total_scores,
    ROUND(AVG(ats.score)::numeric, 2) as overall_average,
    COUNT(CASE WHEN ats.score = 0 THEN 1 END) as did_not_use_count,
    COUNT(CASE WHEN ats.score = 1 THEN 1 END) as basic_usage_count,
    COUNT(CASE WHEN ats.score = 2 THEN 1 END) as good_usage_count,
    COUNT(CASE WHEN ats.score = 3 THEN 1 END) as exemplary_usage_count
FROM ai_tool_scores ats
GROUP BY ats.tool_category
ORDER BY overall_average DESC;

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_tool_scores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE judges ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your security model)
-- GRANT ALL ON evaluations TO authenticated;
-- GRANT ALL ON ai_tool_scores TO authenticated;
-- GRANT ALL ON teams TO authenticated;
-- GRANT ALL ON judges TO authenticated;
-- GRANT SELECT ON team_summaries TO authenticated;
-- GRANT SELECT ON team_ai_tool_averages TO authenticated;
-- GRANT SELECT ON ai_tool_category_stats TO authenticated;

-- Insert sample data (optional - remove if not needed)
-- INSERT INTO teams (name) VALUES 
--     ('Team Alpha'),
--     ('Team Beta'), 
--     ('Team Gamma');

-- Sample evaluation (optional - remove if not needed)
-- INSERT INTO evaluations (team_name, judge_name, solution_description, ex_roles_contribution, learned_new_technique, comments)
-- VALUES ('Team Alpha', 'Judge Smith', 2, 3, true, 'Great presentation with innovative AI usage');

-- Get the evaluation ID for sample AI tool scores
-- WITH sample_eval AS (
--     INSERT INTO evaluations (team_name, judge_name, solution_description, ex_roles_contribution, learned_new_technique, comments)
--     VALUES ('Team Alpha', 'Judge Smith', 2, 3, true, 'Great presentation with innovative AI usage')
--     RETURNING id
-- )
-- INSERT INTO ai_tool_scores (evaluation_id, tool_category, score)
-- SELECT 
--     sample_eval.id,
--     tool_category::ai_tool_category,
--     (random() * 3)::integer
-- FROM sample_eval
-- CROSS JOIN (
--     VALUES 
--         ('synthesizing_research'),
--         ('reviewing_transcripts'),
--         ('service_blueprint_journey_map'),
--         ('summarize_product_docs'),
--         ('generate_design_concepts'),
--         ('generate_messaging_ui'),
--         ('updating_ui_copy'),
--         ('generate_research_plan'),
--         ('drafting_product_docs'),
--         ('generate_multimedia_content'),
--         ('create_release_posts')
-- ) AS categories(tool_category);

-- Useful queries for the application:

-- Get all evaluations with AI tool scores:
-- SELECT 
--     e.*,
--     json_agg(
--         json_build_object(
--             'tool_category', ats.tool_category,
--             'score', ats.score
--         )
--     ) as ai_tool_scores
-- FROM evaluations e
-- LEFT JOIN ai_tool_scores ats ON ats.evaluation_id = e.id
-- GROUP BY e.id
-- ORDER BY e.created_at DESC;

-- Get team leaderboard:
-- SELECT * FROM team_summaries ORDER BY avg_total_score DESC;

-- Get AI tool usage by category:
-- SELECT * FROM ai_tool_category_stats ORDER BY overall_average DESC;