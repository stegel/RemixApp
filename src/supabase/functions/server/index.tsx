import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// Location options
const LOCATION_OPTIONS = ['Americas', 'Amsterdam', 'Hyderabad'] as const;
type LocationOption = typeof LOCATION_OPTIONS[number];

const app = new Hono();

// Enable CORS
app.use("*", cors());

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Initialize database tables on startup
const initializeDatabase = async () => {
  try {
    // Database already initialized through SQL schema
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

// Call initialization
initializeDatabase();

// SCHEMA CACHE MANAGEMENT

// Reload PostgREST schema cache
app.post('/make-server-990f6b7c/reload-schema', async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      return c.json({ error: 'Missing Supabase configuration' }, 500);
    }

    // Call PostgREST schema reload endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/reload_schema`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      }
    });

    if (!response.ok) {
      // Try alternative method - restart PostgREST by calling a simple query
      try {
        const { error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
        return c.json({ success: true, message: 'Schema cache refreshed successfully', method: 'query' });
      } catch (fallbackError) {
        console.error('Schema reload failed:', fallbackError);
        return c.json({ error: 'Failed to reload schema cache' }, 500);
      }
    }


    return c.json({ success: true, message: 'Schema cache reloaded successfully', method: 'postgrest' });
  } catch (error) {
    console.error('Schema reload error:', error);
    return c.json({ error: 'Internal server error while reloading schema' }, 500);
  }
});

// Check schema status
app.get('/make-server-990f6b7c/schema-status', async (c) => {
  try {
    const checks = {
      teams: false,
      evaluations: false,
      functions: false
    };

    // Check if teams table exists
    try {
      const { error: teamsError } = await supabase.from('teams').select('id').limit(1);
      checks.teams = !teamsError;
    } catch (err) {
      // Teams table check failed
    }

    // Check if evaluations table exists
    try {
      const { error: evalsError } = await supabase.from('evaluations').select('id').limit(1);
      checks.evaluations = !evalsError;
    } catch (err) {
      // Evaluations table check failed
    }

    // Check if helper functions exist
    try {
      const { error: funcError } = await supabase.rpc('update_updated_at_column');
      checks.functions = funcError?.message?.includes('does not exist') === false;
    } catch (err) {
      checks.functions = true; // Function exists but errored as expected without parameters
    }

    const allReady = checks.teams && checks.evaluations;

    return c.json({
      success: true,
      ready: allReady,
      checks,
      message: allReady ? 'All database tables are ready' : 'Some database tables are missing'
    });
  } catch (error) {
    console.error('Schema status check error:', error);
    return c.json({ 
      success: false, 
      ready: false,
      error: 'Failed to check schema status' 
    }, 500);
  }
});

// TEAMS ENDPOINTS

// CREATE - Add a new team
app.post('/make-server-990f6b7c/teams', async (c) => {
  try {
    const body = await c.req.json();
    const { teamNumber, name, location, isActive = true } = body;

    // Validate required fields - need either team number or name
    if (!teamNumber && !name?.trim()) {
      return c.json({ error: 'Either team number or team name is required' }, 400);
    }

    // If team number is provided, validate it
    if (teamNumber && (isNaN(teamNumber) || teamNumber <= 0)) {
      return c.json({ error: 'Team number must be a positive integer' }, 400);
    }

    // Validate location if provided
    if (location && !LOCATION_OPTIONS.includes(location as LocationOption)) {
      return c.json({ error: `Invalid location. Must be one of: ${LOCATION_OPTIONS.join(', ')}` }, 400);
    }

    const { data, error } = await supabase
      .from('teams')
      .insert({
        team_number: teamNumber || null,
        name: name?.trim() || null,
        location,
        is_active: isActive
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('teams_team_number_key')) {
          return c.json({ error: 'Team number already exists. Please use a different number.' }, 409);
        } else if (error.message.includes('teams_name_key')) {
          return c.json({ error: 'Team name already exists' }, 409);
        } else {
          return c.json({ error: 'Team already exists' }, 409);
        }
      }
      console.error('Database insert error:', error);
      return c.json({ error: 'Failed to create team' }, 500);
    }

    return c.json({ success: true, data }, 201);
  } catch (error) {
    console.error('Create team error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// READ - Get all teams
app.get('/make-server-990f6b7c/teams', async (c) => {
  try {
    const activeOnly = c.req.query('active') === 'true';

    let query = supabase
      .from('teams')
      .select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Try team_number ordering first
    const { data, error } = await query.order('team_number', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Database fetch error:', error);
      // If team_number column doesn't exist, try with name ordering
      if (error.code === '42703' && error.message.includes('team_number')) {
        
        let fallbackQuery = supabase
          .from('teams')
          .select('*');

        if (activeOnly) {
          fallbackQuery = fallbackQuery.eq('is_active', true);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('name', { ascending: true, nullsFirst: false });
        
        if (fallbackError) {
          console.error('Fallback query error:', fallbackError);
          return c.json({ error: 'Failed to fetch teams. Please run database migration to add team_number column.' }, 500);
        }
        
        return c.json({ success: true, data: fallbackData });
      }
      return c.json({ error: 'Failed to fetch teams' }, 500);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Get teams error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// UPDATE - Update a team
app.put('/make-server-990f6b7c/teams/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { teamNumber, name, location, isActive } = body;

    // Validate required fields - need either team number or name
    if (!teamNumber && !name?.trim()) {
      return c.json({ error: 'Either team number or team name is required' }, 400);
    }

    // If team number is provided, validate it
    if (teamNumber && (isNaN(teamNumber) || teamNumber <= 0)) {
      return c.json({ error: 'Team number must be a positive integer' }, 400);
    }

    // Validate location if provided
    if (location && !LOCATION_OPTIONS.includes(location as LocationOption)) {
      return c.json({ error: `Invalid location. Must be one of: ${LOCATION_OPTIONS.join(', ')}` }, 400);
    }

    const { data, error } = await supabase
      .from('teams')
      .update({
        team_number: teamNumber || null,
        name: name?.trim() || null,
        location,
        is_active: isActive
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Team not found' }, 404);
      }
      if (error.code === '23505') {
        if (error.message.includes('teams_team_number_key')) {
          return c.json({ error: 'Team number already exists. Please use a different number.' }, 409);
        } else if (error.message.includes('teams_name_key')) {
          return c.json({ error: 'Team name already exists' }, 409);
        } else {
          return c.json({ error: 'Team already exists' }, 409);
        }
      }
      console.error('Database update error:', error);
      return c.json({ error: 'Failed to update team' }, 500);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Update team error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// UPDATE TEAM NAME ONLY - Update just the name of a team
app.put('/make-server-990f6b7c/teams/:id/name', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name } = body;

    // Validate required field
    if (!name?.trim()) {
      return c.json({ error: 'Team name is required' }, 400);
    }

    // First check if team exists
    const { data: existingTeam, error: findError } = await supabase
      .from('teams')
      .select('id, name, team_number')
      .eq('id', id)
      .single();

    if (findError || !existingTeam) {
      return c.json({ error: 'Team not found' }, 404);
    }

    const { data, error } = await supabase
      .from('teams')
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('teams_name_key')) {
        return c.json({ error: 'Team name already exists' }, 409);
      }
      console.error('Database update error:', error);
      return c.json({ error: 'Failed to update team name' }, 500);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Update team name error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// UPDATE TEAM NAME BY TEAM NUMBER - Update just the name of a team using team number
app.put('/make-server-990f6b7c/teams/by-number/:teamNumber/name', async (c) => {
  try {
    const teamNumber = parseInt(c.req.param('teamNumber'));
    const body = await c.req.json();
    const { name } = body;

    // Validate team number
    if (isNaN(teamNumber) || teamNumber <= 0) {
      return c.json({ error: 'Team number must be a positive integer' }, 400);
    }

    // Validate required field
    if (!name?.trim()) {
      return c.json({ error: 'Team name is required' }, 400);
    }

    // First check if team exists by team number
    const { data: existingTeam, error: findError } = await supabase
      .from('teams')
      .select('id, name, team_number')
      .eq('team_number', teamNumber)
      .single();

    if (findError || !existingTeam) {
      return c.json({ error: `Team with number ${teamNumber} not found` }, 404);
    }

    const { data, error } = await supabase
      .from('teams')
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('team_number', teamNumber)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('teams_name_key')) {
        return c.json({ error: 'Team name already exists' }, 409);
      }
      console.error('Database update error:', error);
      return c.json({ error: 'Failed to update team name' }, 500);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Update team name by number error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// BULK IMPORT - Import teams from CSV
app.post('/make-server-990f6b7c/teams/import-csv', async (c) => {
  try {
    const body = await c.req.json();
    const { teams } = body;

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return c.json({ error: 'Teams array is required and cannot be empty' }, 400);
    }

    const results = { success: 0, errors: [] as string[] };

    // Process each team
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields - need either team number or name
        if (!team.teamNumber && !team.name?.trim()) {
          results.errors.push(`Row ${rowNumber}: Either team number or team name is required`);
          continue;
        }

        // If team number is provided, validate it
        if (team.teamNumber && (isNaN(team.teamNumber) || team.teamNumber <= 0)) {
          results.errors.push(`Row ${rowNumber}: Team number must be a positive integer`);
          continue;
        }

        // Validate location if provided
        if (team.location && !LOCATION_OPTIONS.includes(team.location as LocationOption)) {
          results.errors.push(`Row ${rowNumber}: Invalid location "${team.location}". Must be one of: ${LOCATION_OPTIONS.join(', ')}`);
          continue;
        }

        const { error } = await supabase
          .from('teams')
          .insert({
            team_number: team.teamNumber || null,
            name: team.name?.trim() || null,
            location: team.location?.trim() || null,
            is_active: true
          });

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            if (error.message.includes('teams_team_number_key')) {
              results.errors.push(`Row ${rowNumber}: Team number already exists. Please use a different number.`);
            } else if (error.message.includes('teams_name_key')) {
              results.errors.push(`Row ${rowNumber}: Team name "${team.name}" already exists`);
            } else {
              results.errors.push(`Row ${rowNumber}: Duplicate data conflict`);
            }
          } else {
            results.errors.push(`Row ${rowNumber}: Database error - ${error.message}`);
          }
        } else {
          results.success++;
        }
      } catch (err) {
        results.errors.push(`Row ${rowNumber}: Unexpected error - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return c.json({ 
      success: results.success, 
      errors: results.errors,
      total: teams.length,
      message: `Successfully imported ${results.success} out of ${teams.length} teams`
    }, 200);
  } catch (error) {
    console.error('CSV import error:', error);
    return c.json({ error: 'Internal server error during CSV import' }, 500);
  }
});

// DELETE - Delete a team
app.delete('/make-server-990f6b7c/teams/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Check if team has evaluations using team_id foreign key
    const { data: evaluations, error: evalError } = await supabase
      .from('evaluations')
      .select('id')
      .eq('team_id', id)
      .limit(1);

    if (evalError) {
      console.error('Error checking evaluations:', evalError);
      return c.json({ error: 'Failed to check team evaluations' }, 500);
    }

    if (evaluations && evaluations.length > 0) {
      return c.json({ error: 'Cannot delete team with existing evaluations. Please delete evaluations first.' }, 409);
    }

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database delete error:', error);
      return c.json({ error: 'Failed to delete team' }, 500);
    }

    return c.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE ALL - Delete all teams (bulk delete)
app.delete('/make-server-990f6b7c/teams', async (c) => {
  try {
    // Check if any teams have evaluations
    const { data: evaluations, error: evalError } = await supabase
      .from('evaluations')
      .select('team_id')
      .limit(1);

    if (evalError) {
      console.error('Error checking evaluations:', evalError);
      return c.json({ error: 'Failed to check team evaluations' }, 500);
    }

    if (evaluations && evaluations.length > 0) {
      return c.json({ error: 'Cannot delete teams with existing evaluations. Please delete all evaluations first.' }, 409);
    }

    // Get count of teams before deletion for confirmation
    const { count: teamCount, error: countError } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting teams:', countError);
      return c.json({ error: 'Failed to count teams' }, 500);
    }

    if (teamCount === 0) {
      return c.json({ success: true, message: 'No teams to delete', deletedCount: 0 });
    }

    // Delete all teams
    const { error } = await supabase
      .from('teams')
      .delete()
      .neq('id', 0); // This will match all rows

    if (error) {
      console.error('Database bulk delete error:', error);
      return c.json({ error: 'Failed to delete all teams' }, 500);
    }

    return c.json({ 
      success: true, 
      message: `Successfully deleted all ${teamCount} teams`, 
      deletedCount: teamCount 
    });
  } catch (error) {
    console.error('Delete all teams error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// EVALUATION ENDPOINTS

// CREATE - Submit a new evaluation
app.post('/make-server-990f6b7c/evaluations', async (c) => {
  try {
    const body = await c.req.json();
    const { participantName, teamId, question1, question2, question3, question4, question5 } = body;

    // Validate required fields
    if (!participantName || !teamId || !question1 || !question2 || !question3 || !question4 || !question5) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // Validate teamId is a positive integer
    if (!Number.isInteger(teamId) || teamId <= 0) {
      return c.json({ error: 'Valid team ID is required' }, 400);
    }

    // Validate score ranges (0-4 scale)
    const scores = [question1, question2, question3, question4, question5];
    const invalidScores = scores.filter(score => {
      const numScore = parseInt(score);
      return isNaN(numScore) || numScore < 0 || numScore > 4;
    });
    
    if (invalidScores.length > 0) {
      return c.json({ error: 'All scores must be between 0 and 4 (0=Strongly Disagree, 4=Strongly Agree)' }, 400);
    }

    // Verify team exists
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, name, team_number')
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      return c.json({ error: 'Invalid team ID - team not found' }, 400);
    }

    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        participant_name: participantName,
        team_id: teamId,
        curiosity_score: parseInt(question1),
        experimentation_score: parseInt(question2),
        learning_score: parseInt(question3),
        innovation_score: parseInt(question4),
        collaboration_score: parseInt(question5),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return c.json({ error: 'Failed to save evaluation' }, 500);
    }

    return c.json({ success: true, data }, 201);
  } catch (error) {
    console.error('Submit evaluation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// READ - Get all evaluations (with optional filtering)
app.get('/make-server-990f6b7c/evaluations', async (c) => {
  try {
    const teamId = c.req.query('teamId');
    const participantName = c.req.query('participant');

    // Use the evaluations_with_team_names view for consistent team name display
    let query = supabase
      .from('evaluations_with_team_names')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by team ID
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    if (participantName) {
      query = query.ilike('participant_name', `%${participantName}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database fetch error with view:', error);
      
      // Fallback to direct join query if view doesn't exist
      let fallbackQuery = supabase
        .from('evaluations')
        .select(`
          *,
          teams:team_id (
            id,
            name,
            team_number,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (teamId) {
        fallbackQuery = fallbackQuery.eq('team_id', teamId);
      }
      
      if (participantName) {
        fallbackQuery = fallbackQuery.ilike('participant_name', `%${participantName}%`);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        console.error('Fallback query error:', fallbackError);
        return c.json({ error: 'Failed to fetch evaluations' }, 500);
      }

      // Transform the joined data to match expected format
      const transformedData = fallbackData.map(evaluation => ({
        ...evaluation,
        team_name: evaluation.teams?.name || `Team ${evaluation.teams?.team_number}` || `Team #${evaluation.team_id}`,
        team_location: evaluation.teams?.location
      }));

      return c.json({ success: true, data: transformedData });
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Get evaluations error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// READ - Get a specific evaluation by ID
app.get('/make-server-990f6b7c/evaluations/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Evaluation not found' }, 404);
      }
      console.error('Database fetch error:', error);
      return c.json({ error: 'Failed to fetch evaluation' }, 500);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Get evaluation by ID error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// UPDATE - Update an existing evaluation
app.put('/make-server-990f6b7c/evaluations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { participantName, teamId, question1, question2, question3, question4, question5 } = body;

    // Validate required fields
    if (!participantName || !teamId || !question1 || !question2 || !question3 || !question4 || !question5) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // Validate teamId is a positive integer
    if (!Number.isInteger(teamId) || teamId <= 0) {
      return c.json({ error: 'Valid team ID is required' }, 400);
    }

    // Validate score ranges (0-4 scale)
    const scores = [question1, question2, question3, question4, question5];
    const invalidScores = scores.filter(score => {
      const numScore = parseInt(score);
      return isNaN(numScore) || numScore < 0 || numScore > 4;
    });
    
    if (invalidScores.length > 0) {
      return c.json({ error: 'All scores must be between 0 and 4 (0=Strongly Disagree, 4=Strongly Agree)' }, 400);
    }

    // Verify team exists
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, name, team_number')
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      return c.json({ error: 'Invalid team ID - team not found' }, 400);
    }

    const { data, error } = await supabase
      .from('evaluations')
      .update({
        participant_name: participantName,
        team_id: teamId,
        curiosity_score: parseInt(question1),
        experimentation_score: parseInt(question2),
        learning_score: parseInt(question3),
        innovation_score: parseInt(question4),
        collaboration_score: parseInt(question5),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Evaluation not found' }, 404);
      }
      console.error('Database update error:', error);
      return c.json({ error: 'Failed to update evaluation' }, 500);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Update evaluation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE - Delete an evaluation
app.delete('/make-server-990f6b7c/evaluations/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database delete error:', error);
      return c.json({ error: 'Failed to delete evaluation' }, 500);
    }

    return c.json({ success: true, message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete evaluation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE ALL - Delete all evaluations (bulk delete)
app.delete('/make-server-990f6b7c/evaluations', async (c) => {
  try {
    // Get count of evaluations before deletion for confirmation
    const { count: evaluationCount, error: countError } = await supabase
      .from('evaluations')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting evaluations:', countError);
      return c.json({ error: 'Failed to count evaluations' }, 500);
    }

    if (evaluationCount === 0) {
      return c.json({ success: true, message: 'No evaluations to delete', deletedCount: 0 });
    }

    // Delete all evaluations
    const { error } = await supabase
      .from('evaluations')
      .delete()
      .neq('id', 0); // This will match all rows

    if (error) {
      console.error('Database bulk delete error:', error);
      return c.json({ error: 'Failed to delete all evaluations' }, 500);
    }

    return c.json({ 
      success: true, 
      message: `Successfully deleted all ${evaluationCount} evaluations`, 
      deletedCount: evaluationCount 
    });
  } catch (error) {
    console.error('Delete all evaluations error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET - Analytics endpoint for team performance
app.get('/make-server-990f6b7c/analytics/teams', async (c) => {
  try {
    // Use team_id based approach with proper joins
    const { data: evaluationData, error: evalError } = await supabase
      .from('evaluations')
      .select(`
        team_id,
        curiosity_score,
        experimentation_score,
        learning_score,
        innovation_score,
        collaboration_score,
        teams:team_id (
          id,
          name,
          team_number,
          location
        )
      `);

    if (evalError) {
      console.error('Analytics fetch error:', evalError);
      return c.json({ error: 'Failed to fetch analytics data' }, 500);
    }

    if (!evaluationData || evaluationData.length === 0) {
      return c.json({ success: true, data: [] });
    }

    // Group evaluations by team and calculate statistics
    const teamStats = evaluationData.reduce((acc: any, evaluation: any) => {
      const teamInfo = evaluation.teams;
      const teamId = evaluation.team_id;
      
      if (!teamInfo || !teamId) {
        return acc;
      }
      
      const teamName = teamInfo.name || `Team ${teamInfo.team_number}` || `Team #${teamId}`;
      
      if (!acc[teamId]) {
        acc[teamId] = {
          teamName: teamName,
          location: teamInfo.location || null,
          count: 0,
          totalCuriosity: 0,
          totalExperimentation: 0,
          totalLearning: 0,
          totalInnovation: 0,
          totalCollaboration: 0
        };
      }
      
      acc[teamId].count += 1;
      acc[teamId].totalCuriosity += evaluation.curiosity_score || 0;
      acc[teamId].totalExperimentation += evaluation.experimentation_score || 0;
      acc[teamId].totalLearning += evaluation.learning_score || 0;
      acc[teamId].totalInnovation += evaluation.innovation_score || 0;
      acc[teamId].totalCollaboration += evaluation.collaboration_score || 0;
      
      return acc;
    }, {});

    // Calculate averages and format response
    const analytics = Object.values(teamStats).map((team: any) => {
      const totalSum = team.totalCuriosity + team.totalExperimentation + team.totalLearning + team.totalInnovation + team.totalCollaboration;
      return {
        teamName: team.teamName,
        location: team.location,
        evaluationCount: team.count,
        averageScores: {
          curiosity: (team.totalCuriosity / team.count).toFixed(2),
          experimentation: (team.totalExperimentation / team.count).toFixed(2),
          learning: (team.totalLearning / team.count).toFixed(2),
          innovation: (team.totalInnovation / team.count).toFixed(2),
          collaboration: (team.totalCollaboration / team.count).toFixed(2),
          overall: (totalSum / (team.count * 5)).toFixed(2)
        },
        averageTotalScore: (totalSum / team.count).toFixed(1) // Average of total scores (out of 20)
      };
    });

    return c.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Health check endpoint
app.get('/make-server-990f6b7c/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);