import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export interface DatabaseTeam {
  id: string;
  team_number: number;
  team_name?: string;
  created_at: string;
  updated_at: string;
}

// Database types based on our schema
export interface DatabaseEvaluation {
  id: string;
  team_name: string;
  judge_name: string;
  solution_description: number;
  ex_roles_contribution: number;
  learned_new_technique: boolean;
  comments: string;
  ai_tools_total: number;
  ai_tools_average: number;
  total_score: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAIToolScore {
  id: string;
  evaluation_id: string;
  tool_category: string;
  score: number;
  created_at: string;
}

export interface DatabaseTeamSummary {
  team_name: string;
  evaluation_count: number;
  avg_ai_tools_total: number;
  avg_ai_tools_average: number;
  avg_solution_description: number;
  avg_ex_roles_contribution: number;
  avg_total_score: number;
  learned_new_technique_count: number;
  learned_new_technique_percentage: number;
  first_evaluation_at: string;
  last_evaluation_at: string;
}

// Map tool key to database enum value
export const TOOL_KEY_TO_ENUM: Record<string, string> = {
  synthesizingResearch: 'synthesizing_research',
  reviewingTranscripts: 'reviewing_transcripts',
  serviceBlueprintJourneyMap: 'service_blueprint_journey_map',
  summarizeProductDocs: 'summarize_product_docs',
  generateDesignConcepts: 'generate_design_concepts',
  generateMessagingUI: 'generate_messaging_ui',
  updatingUICopy: 'updating_ui_copy',
  generateResearchPlan: 'generate_research_plan',
  draftingProductDocs: 'drafting_product_docs',
  generateMultimediaContent: 'generate_multimedia_content',
  createReleasePosts: 'create_release_posts',
};

// Map enum value back to tool key
export const ENUM_TO_TOOL_KEY: Record<string, string> = Object.entries(TOOL_KEY_TO_ENUM)
  .reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});