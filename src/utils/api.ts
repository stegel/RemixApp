import { supabase, TOOL_KEY_TO_ENUM, ENUM_TO_TOOL_KEY, DatabaseEvaluation, DatabaseAIToolScore, DatabaseTeamSummary } from './supabase/client';

interface AIToolsScores {
  synthesizingResearch: number;
  reviewingTranscripts: number;
  serviceBlueprintJourneyMap: number;
  summarizeProductDocs: number;
  generateDesignConcepts: number;
  generateMessagingUI: number;
  updatingUICopy: number;
  generateResearchPlan: number;
  draftingProductDocs: number;
  generateMultimediaContent: number;
  createReleasePosts: number;
}

interface JudgingCriteria {
  aiToolsScores: AIToolsScores;
  solutionDescription: number; // 1=Basic, 2=Thoughtful, 3=Extraordinary
  exRolesContribution: number; // 1=Basic, 2=Thoughtful, 3=Extraordinary
  learnedNewTechnique: boolean;
}

export interface JudgingSubmission {
  teamName: string;
  judgeName: string;
  scores: JudgingCriteria;
  comments: string;
}

export interface Evaluation {
  id: string;
  teamName: string;
  judgeName: string;
  scores: JudgingCriteria;
  comments: string;
  timestamp: string;
  totalScore: number;
  averageScore: number;
  aiToolsTotal: number;
  aiToolsAverage: number;
}

export interface TeamSummary {
  teamName: string;
  evaluationCount: number;
  averageScores: {
    aiToolsScores: AIToolsScores;
    aiToolsTotal: number;
    aiToolsAverage: number;
    solutionDescription: number;
    exRolesContribution: number;
    total: number;
  };
  learnedNewTechniqueCount: number;
  learnedNewTechniquePercentage: number;
  evaluations: Evaluation[];
}

// Helper function to convert database evaluation to API format
function convertDatabaseEvaluationToAPI(dbEval: DatabaseEvaluation, aiToolScores: DatabaseAIToolScore[]): Evaluation {
  // Convert AI tool scores from array to object
  const aiToolsScores: AIToolsScores = {
    synthesizingResearch: 0,
    reviewingTranscripts: 0,
    serviceBlueprintJourneyMap: 0,
    summarizeProductDocs: 0,
    generateDesignConcepts: 0,
    generateMessagingUI: 0,
    updatingUICopy: 0,
    generateResearchPlan: 0,
    draftingProductDocs: 0,
    generateMultimediaContent: 0,
    createReleasePosts: 0,
  };

  aiToolScores.forEach(score => {
    const toolKey = ENUM_TO_TOOL_KEY[score.tool_category] as keyof AIToolsScores;
    if (toolKey) {
      aiToolsScores[toolKey] = score.score;
    }
  });

  return {
    id: dbEval.id,
    teamName: dbEval.team_name,
    judgeName: dbEval.judge_name,
    scores: {
      aiToolsScores,
      solutionDescription: dbEval.solution_description,
      exRolesContribution: dbEval.ex_roles_contribution,
      learnedNewTechnique: dbEval.learned_new_technique,
    },
    comments: dbEval.comments,
    timestamp: dbEval.created_at,
    totalScore: dbEval.total_score,
    averageScore: 0, // Will be calculated if needed
    aiToolsTotal: dbEval.ai_tools_total,
    aiToolsAverage: dbEval.ai_tools_average,
  };
}

export const api = {
  // Submit evaluation
  submitEvaluation: async (submission: JudgingSubmission): Promise<{ success: boolean; evaluationId: string }> => {
    try {
      // Insert evaluation
      const { data: evaluation, error: evalError } = await supabase
        .from('evaluations')
        .insert({
          team_name: submission.teamName,
          judge_name: submission.judgeName,
          solution_description: submission.scores.solutionDescription,
          ex_roles_contribution: submission.scores.exRolesContribution,
          learned_new_technique: submission.scores.learnedNewTechnique,
          comments: submission.comments,
        })
        .select()
        .single();

      if (evalError) {
        console.error('Error inserting evaluation:', evalError);
        throw new Error(`Failed to create evaluation: ${evalError.message}`);
      }

      // Insert AI tool scores
      const aiToolScoresData = Object.entries(submission.scores.aiToolsScores).map(([toolKey, score]) => ({
        evaluation_id: evaluation.id,
        tool_category: TOOL_KEY_TO_ENUM[toolKey],
        score: score,
      }));

      const { error: scoresError } = await supabase
        .from('ai_tool_scores')
        .insert(aiToolScoresData);

      if (scoresError) {
        console.error('Error inserting AI tool scores:', scoresError);
        // Clean up the evaluation if scores failed
        await supabase.from('evaluations').delete().eq('id', evaluation.id);
        throw new Error(`Failed to create AI tool scores: ${scoresError.message}`);
      }

      console.log(`Evaluation submitted successfully: ${evaluation.id}`);
      return { success: true, evaluationId: evaluation.id };
    } catch (error) {
      console.error('Error in submitEvaluation:', error);
      throw error;
    }
  },

  // Get all evaluations
  getEvaluations: async (): Promise<{ evaluations: Evaluation[] }> => {
    try {
      // Get evaluations with AI tool scores
      const { data: evaluations, error: evalError } = await supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      if (evalError) {
        console.error('Error fetching evaluations:', evalError);
        throw new Error(`Failed to fetch evaluations: ${evalError.message}`);
      }

      // Get all AI tool scores
      const evaluationIds = evaluations?.map(e => e.id) || [];
      if (evaluationIds.length === 0) {
        return { evaluations: [] };
      }

      const { data: aiToolScores, error: scoresError } = await supabase
        .from('ai_tool_scores')
        .select('*')
        .in('evaluation_id', evaluationIds);

      if (scoresError) {
        console.error('Error fetching AI tool scores:', scoresError);
        throw new Error(`Failed to fetch AI tool scores: ${scoresError.message}`);
      }

      // Group AI tool scores by evaluation ID
      const scoresByEvaluation: Record<string, DatabaseAIToolScore[]> = {};
      aiToolScores?.forEach(score => {
        if (!scoresByEvaluation[score.evaluation_id]) {
          scoresByEvaluation[score.evaluation_id] = [];
        }
        scoresByEvaluation[score.evaluation_id].push(score);
      });

      // Convert to API format
      const apiEvaluations = evaluations.map(dbEval => 
        convertDatabaseEvaluationToAPI(dbEval, scoresByEvaluation[dbEval.id] || [])
      );

      return { evaluations: apiEvaluations };
    } catch (error) {
      console.error('Error in getEvaluations:', error);
      throw error;
    }
  },

  // Get evaluations by team
  getTeamEvaluations: async (teamName: string): Promise<{ evaluations: Evaluation[] }> => {
    try {
      // Get evaluations for specific team
      const { data: evaluations, error: evalError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('team_name', teamName)
        .order('created_at', { ascending: false });

      if (evalError) {
        console.error('Error fetching team evaluations:', evalError);
        throw new Error(`Failed to fetch team evaluations: ${evalError.message}`);
      }

      // Get AI tool scores for these evaluations
      const evaluationIds = evaluations?.map(e => e.id) || [];
      if (evaluationIds.length === 0) {
        return { evaluations: [] };
      }

      const { data: aiToolScores, error: scoresError } = await supabase
        .from('ai_tool_scores')
        .select('*')
        .in('evaluation_id', evaluationIds);

      if (scoresError) {
        console.error('Error fetching AI tool scores:', scoresError);
        throw new Error(`Failed to fetch AI tool scores: ${scoresError.message}`);
      }

      // Group AI tool scores by evaluation ID
      const scoresByEvaluation: Record<string, DatabaseAIToolScore[]> = {};
      aiToolScores?.forEach(score => {
        if (!scoresByEvaluation[score.evaluation_id]) {
          scoresByEvaluation[score.evaluation_id] = [];
        }
        scoresByEvaluation[score.evaluation_id].push(score);
      });

      // Convert to API format
      const apiEvaluations = evaluations.map(dbEval => 
        convertDatabaseEvaluationToAPI(dbEval, scoresByEvaluation[dbEval.id] || [])
      );

      return { evaluations: apiEvaluations };
    } catch (error) {
      console.error('Error in getTeamEvaluations:', error);
      throw error;
    }
  },

  // Get team summary/leaderboard using the database view
  getTeamSummary: async (): Promise<{ teams: TeamSummary[] }> => {
    try {
      // Get team summaries from the view
      const { data: teamSummaries, error: summaryError } = await supabase
        .from('team_summaries')
        .select('*')
        .order('avg_total_score', { ascending: false });

      if (summaryError) {
        console.error('Error fetching team summaries:', summaryError);
        throw new Error(`Failed to fetch team summaries: ${summaryError.message}`);
      }

      // Get detailed AI tool averages for each team
      const { data: aiToolAverages, error: toolError } = await supabase
        .from('team_ai_tool_averages')
        .select('*');

      if (toolError) {
        console.error('Error fetching AI tool averages:', toolError);
        throw new Error(`Failed to fetch AI tool averages: ${toolError.message}`);
      }

      // Group AI tool averages by team
      const toolAveragesByTeam: Record<string, Record<string, number>> = {};
      aiToolAverages?.forEach(avg => {
        if (!toolAveragesByTeam[avg.team_name]) {
          toolAveragesByTeam[avg.team_name] = {};
        }
        const toolKey = ENUM_TO_TOOL_KEY[avg.tool_category];
        if (toolKey) {
          toolAveragesByTeam[avg.team_name][toolKey] = avg.avg_score;
        }
      });

      // Get all evaluations for each team (for detailed view)
      const allEvaluationsResult = await api.getEvaluations();

      // Convert to API format
      const apiTeamSummaries: TeamSummary[] = teamSummaries?.map(summary => {
        const teamEvaluations = allEvaluationsResult.evaluations.filter(
          evaluation => evaluation.teamName === summary.team_name
        );

        // Build AI tools scores object
        const aiToolsScores: AIToolsScores = {
          synthesizingResearch: toolAveragesByTeam[summary.team_name]?.synthesizingResearch || 0,
          reviewingTranscripts: toolAveragesByTeam[summary.team_name]?.reviewingTranscripts || 0,
          serviceBlueprintJourneyMap: toolAveragesByTeam[summary.team_name]?.serviceBlueprintJourneyMap || 0,
          summarizeProductDocs: toolAveragesByTeam[summary.team_name]?.summarizeProductDocs || 0,
          generateDesignConcepts: toolAveragesByTeam[summary.team_name]?.generateDesignConcepts || 0,
          generateMessagingUI: toolAveragesByTeam[summary.team_name]?.generateMessagingUI || 0,
          updatingUICopy: toolAveragesByTeam[summary.team_name]?.updatingUICopy || 0,
          generateResearchPlan: toolAveragesByTeam[summary.team_name]?.generateResearchPlan || 0,
          draftingProductDocs: toolAveragesByTeam[summary.team_name]?.draftingProductDocs || 0,
          generateMultimediaContent: toolAveragesByTeam[summary.team_name]?.generateMultimediaContent || 0,
          createReleasePosts: toolAveragesByTeam[summary.team_name]?.createReleasePosts || 0,
        };

        return {
          teamName: summary.team_name,
          evaluationCount: summary.evaluation_count,
          averageScores: {
            aiToolsScores,
            aiToolsTotal: summary.avg_ai_tools_total,
            aiToolsAverage: summary.avg_ai_tools_average,
            solutionDescription: summary.avg_solution_description,
            exRolesContribution: summary.avg_ex_roles_contribution,
            total: summary.avg_total_score,
          },
          learnedNewTechniqueCount: summary.learned_new_technique_count,
          learnedNewTechniquePercentage: summary.learned_new_technique_percentage,
          evaluations: teamEvaluations,
        };
      }) || [];

      return { teams: apiTeamSummaries };
    } catch (error) {
      console.error('Error in getTeamSummary:', error);
      throw error;
    }
  },

  // Delete evaluation
  deleteEvaluation: async (evaluationId: string): Promise<{ success: boolean }> => {
    try {
      // Delete evaluation (AI tool scores will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('evaluations')
        .delete()
        .eq('id', evaluationId);

      if (error) {
        console.error('Error deleting evaluation:', error);
        throw new Error(`Failed to delete evaluation: ${error.message}`);
      }

      console.log(`Evaluation deleted successfully: ${evaluationId}`);
      return { success: true };
    } catch (error) {
      console.error('Error in deleteEvaluation:', error);
      throw error;
    }
  },

  // Health check - just test the database connection
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    try {
      const { error } = await supabase
        .from('evaluations')
        .select('id')
        .limit(1);

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Team management functions
  getTeams: async (): Promise<{ teams: { id: string; name: string; created_at: string }[] }> => {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, created_at')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching teams:', error);
        throw new Error(`Failed to fetch teams: ${error.message}`);
      }

      return { teams: teams || [] };
    } catch (error) {
      console.error('Error in getTeams:', error);
      throw error;
    }
  },

  addTeam: async (teamName: string): Promise<{ success: boolean; teamId: string }> => {
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .insert({ name: teamName.trim() })
        .select()
        .single();

      if (error) {
        console.error('Error adding team:', error);
        throw new Error(`Failed to add team: ${error.message}`);
      }

      console.log(`Team added successfully: ${team.id}`);
      return { success: true, teamId: team.id };
    } catch (error) {
      console.error('Error in addTeam:', error);
      throw error;
    }
  },

  deleteTeam: async (teamId: string): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) {
        console.error('Error deleting team:', error);
        throw new Error(`Failed to delete team: ${error.message}`);
      }

      console.log(`Team deleted successfully: ${teamId}`);
      return { success: true };
    } catch (error) {
      console.error('Error in deleteTeam:', error);
      throw error;
    }
  },

  // Get evaluation count by team name (for admin display)
  getEvaluationCountByTeam: async (teamName: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('team_name', teamName);

      if (error) {
        console.error('Error counting evaluations:', error);
        throw new Error(`Failed to count evaluations: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getEvaluationCountByTeam:', error);
      throw error;
    }
  },
};

export const AI_TOOLS_CATEGORIES = [
  { key: 'synthesizingResearch', label: 'Synthesizing existing research' },
  { key: 'reviewingTranscripts', label: 'Reviewing transcripts' },
  { key: 'serviceBlueprintJourneyMap', label: 'Generating a service blueprint or journey map' },
  { key: 'summarizeProductDocs', label: 'Summarize existing product documentation' },
  { key: 'generateDesignConcepts', label: 'Generate at least 3 different design concepts' },
  { key: 'generateMessagingUI', label: 'Generate messaging and UI content' },
  { key: 'updatingUICopy', label: 'Updating UI copy' },
  { key: 'generateResearchPlan', label: 'Generate a research study plan' },
  { key: 'draftingProductDocs', label: 'Drafting product documentation' },
  { key: 'generateMultimediaContent', label: 'Generate multimedia content for documentation' },
  { key: 'createReleasePosts', label: 'Create release-related posts for Community' },
] as const;

export const AI_TOOLS_SCALE_LABELS = [
  'Did not use',
  'Basic usage',
  'Good usage',
  'Exemplary usage'
] as const;

export const EVALUATION_SCALE_LABELS = [
  'Did not demonstrate',
  'Basic',
  'Thoughtful', 
  'Extraordinary'
] as const;

export const EVALUATION_SCALE_VALUES = {
  didNotDemonstrate: 0,
  basic: 1,
  thoughtful: 2,
  extraordinary: 3
} as const;