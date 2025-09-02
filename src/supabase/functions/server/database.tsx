import { createClient } from "npm:@supabase/supabase-js@2";

// Initialize the evaluations table
export const createEvaluationsTable = async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // SQL to create the evaluations table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY,
      participant_name VARCHAR(255) NOT NULL,
      team_name VARCHAR(255) NOT NULL,
      curiosity_score INTEGER NOT NULL CHECK (curiosity_score >= 1 AND curiosity_score <= 5),
      experimentation_score INTEGER NOT NULL CHECK (experimentation_score >= 1 AND experimentation_score <= 5),
      learning_score INTEGER NOT NULL CHECK (learning_score >= 1 AND learning_score <= 5),
      innovation_score INTEGER NOT NULL CHECK (innovation_score >= 1 AND innovation_score <= 5),
      collaboration_score INTEGER NOT NULL CHECK (collaboration_score >= 1 AND collaboration_score <= 5),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_evaluations_team_name ON evaluations(team_name);
    CREATE INDEX IF NOT EXISTS idx_evaluations_participant_name ON evaluations(participant_name);
    CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);

    -- Create RPC function for table creation
    CREATE OR REPLACE FUNCTION create_evaluations_table()
    RETURNS void AS $$
    BEGIN
      -- Function body is handled by the actual table creation above
      RETURN;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('Error creating evaluations table:', error);
      throw error;
    }
    
    console.log('Evaluations table created successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};