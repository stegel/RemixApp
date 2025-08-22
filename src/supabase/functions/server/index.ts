// DEPRECATED: This app now uses Supabase client directly
// The server endpoints are no longer needed as the app connects to Supabase tables directly
// See /utils/supabase/client.ts and /utils/api.ts for the new implementation
//
// The app now uses the following tables created by supabase_schema.sql:
// - evaluations: Main evaluation data
// - ai_tool_scores: Individual AI tool scores (normalized)
// - team_summaries: Database view for team aggregations
// - team_ai_tool_averages: Database view for AI tool analysis

/*
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Setup middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to calculate AI tools scores
function calculateAIToolsScores(aiToolsScores: any) {
  const values = Object.values(aiToolsScores) as number[];
  const total = values.reduce((sum, score) => sum + score, 0);
  const average = total / values.length;
  return { total, average };
}

// Helper function to calculate total scores
function calculateTotalScores(scores: any) {
  const aiTools = calculateAIToolsScores(scores.aiToolsScores);
  const totalScore = aiTools.total + scores.solutionDescription + scores.exRolesContribution;
  const averageScore = totalScore / (Object.keys(scores.aiToolsScores).length + 2); // +2 for solutionDescription and exRolesContribution
  
  return {
    totalScore,
    averageScore,
    aiToolsTotal: aiTools.total,
    aiToolsAverage: aiTools.average
  };
}

// Routes
app.get('/make-server-9605d89f/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Submit evaluation
app.post('/make-server-9605d89f/evaluations', async (c) => {
  try {
    const body = await c.req.json();
    const { teamName, judgeName, scores, comments } = body;

    if (!teamName || !judgeName || !scores || !scores.aiToolsScores) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create evaluation ID
    const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate scores
    const calculatedScores = calculateTotalScores(scores);
    
    // Store evaluation
    const evaluation = {
      id: evaluationId,
      teamName,
      judgeName,
      scores,
      comments: comments || '',
      timestamp: new Date().toISOString(),
      ...calculatedScores
    };

    await kv.set(`evaluation:${evaluationId}`, evaluation);
    
    // Update team scores aggregation
    const existingTeamData = await kv.get(`team:${teamName}`);
    const teamEvaluations = existingTeamData ? existingTeamData.evaluations : [];
    teamEvaluations.push(evaluationId);
    
    await kv.set(`team:${teamName}`, {
      teamName,
      evaluations: teamEvaluations,
      lastUpdated: new Date().toISOString()
    });

    console.log(`Evaluation submitted successfully: ${evaluationId}`);
    return c.json({ success: true, evaluationId });
  } catch (error) {
    console.log(`Error submitting evaluation: ${error}`);
    return c.json({ error: 'Failed to submit evaluation' }, 500);
  }
});

// Get all evaluations
app.get('/make-server-9605d89f/evaluations', async (c) => {
  try {
    const evaluations = await kv.getByPrefix('evaluation:');
    return c.json({ evaluations });
  } catch (error) {
    console.log(`Error fetching evaluations: ${error}`);
    return c.json({ error: 'Failed to fetch evaluations' }, 500);
  }
});

// Get evaluations by team
app.get('/make-server-9605d89f/evaluations/team/:teamName', async (c) => {
  try {
    const teamName = c.req.param('teamName');
    const teamData = await kv.get(`team:${teamName}`);
    
    if (!teamData) {
      return c.json({ evaluations: [] });
    }

    const evaluations = [];
    for (const evalId of teamData.evaluations) {
      const evaluation = await kv.get(`evaluation:${evalId}`);
      if (evaluation) {
        evaluations.push(evaluation);
      }
    }

    return c.json({ evaluations });
  } catch (error) {
    console.log(`Error fetching team evaluations: ${error}`);
    return c.json({ error: 'Failed to fetch team evaluations' }, 500);
  }
});

// Get team summary/leaderboard
app.get('/make-server-9605d89f/teams/summary', async (c) => {
  try {
    const teams = await kv.getByPrefix('team:');
    const teamSummaries = [];

    for (const team of teams) {
      const evaluations = [];
      for (const evalId of team.evaluations) {
        const evaluation = await kv.get(`evaluation:${evalId}`);
        if (evaluation) {
          evaluations.push(evaluation);
        }
      }

      if (evaluations.length > 0) {
        // Calculate average scores for AI tools
        const aiToolsKeys = Object.keys(evaluations[0].scores.aiToolsScores);
        const avgAIToolsScores = {};
        
        for (const key of aiToolsKeys) {
          const total = evaluations.reduce((sum, eval) => sum + eval.scores.aiToolsScores[key], 0);
          avgAIToolsScores[key] = total / evaluations.length;
        }

        const totalScores = evaluations.reduce((acc, eval) => ({
          aiToolsTotal: acc.aiToolsTotal + eval.aiToolsTotal,
          solutionDescription: acc.solutionDescription + eval.scores.solutionDescription,
          exRolesContribution: acc.exRolesContribution + eval.scores.exRolesContribution,
          total: acc.total + eval.totalScore
        }), { aiToolsTotal: 0, solutionDescription: 0, exRolesContribution: 0, total: 0 });

        const avgScores = {
          aiToolsScores: avgAIToolsScores,
          aiToolsTotal: totalScores.aiToolsTotal / evaluations.length,
          aiToolsAverage: totalScores.aiToolsTotal / evaluations.length / aiToolsKeys.length,
          solutionDescription: totalScores.solutionDescription / evaluations.length,
          exRolesContribution: totalScores.exRolesContribution / evaluations.length,
          total: totalScores.total / evaluations.length
        };

        // Calculate learning statistics
        const learnedNewTechniqueCount = evaluations.filter(eval => eval.scores.learnedNewTechnique === true).length;
        const learnedNewTechniquePercentage = (learnedNewTechniqueCount / evaluations.length) * 100;

        teamSummaries.push({
          teamName: team.teamName,
          evaluationCount: evaluations.length,
          averageScores: avgScores,
          learnedNewTechniqueCount,
          learnedNewTechniquePercentage,
          evaluations: evaluations
        });
      }
    }

    // Sort by total average score
    teamSummaries.sort((a, b) => b.averageScores.total - a.averageScores.total);

    return c.json({ teams: teamSummaries });
  } catch (error) {
    console.log(`Error fetching team summary: ${error}`);
    return c.json({ error: 'Failed to fetch team summary' }, 500);
  }
});

// Delete evaluation (for admin purposes)
app.delete('/make-server-9605d89f/evaluations/:id', async (c) => {
  try {
    const evaluationId = c.req.param('id');
    const evaluation = await kv.get(`evaluation:${evaluationId}`);
    
    if (!evaluation) {
      return c.json({ error: 'Evaluation not found' }, 404);
    }

    await kv.del(`evaluation:${evaluationId}`);
    
    // Remove from team evaluations list
    const teamData = await kv.get(`team:${evaluation.teamName}`);
    if (teamData) {
      const updatedEvaluations = teamData.evaluations.filter(id => id !== evaluationId);
      await kv.set(`team:${evaluation.teamName}`, {
        ...teamData,
        evaluations: updatedEvaluations,
        lastUpdated: new Date().toISOString()
      });
    }

    console.log(`Evaluation deleted successfully: ${evaluationId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting evaluation: ${error}`);
    return c.json({ error: 'Failed to delete evaluation' }, 500);
  }
});

// Deno.serve(app.fetch);
*/