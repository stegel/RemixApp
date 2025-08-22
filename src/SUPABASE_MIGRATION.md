# Migration to Supabase Database Tables

This app has been updated to use Supabase database tables directly instead of the previous KV store approach through server endpoints.

## Changes Made

### Database Schema
- Created proper relational database tables using `supabase_schema.sql`
- **evaluations** table: Main evaluation data with team, judge, scores, and metadata
- **ai_tool_scores** table: Normalized AI tool scores for better querying and analysis
- **Database views**: Pre-built queries for team summaries and AI tool analysis
- **Triggers**: Automatic score calculations when data changes

### Application Updates
- **New Supabase client**: `/utils/supabase/client.ts` - Direct database connection
- **Updated API layer**: `/utils/api.ts` - Now uses Supabase client instead of server endpoints
- **Preserved UI**: All React components remain unchanged due to consistent API interface
- **Deprecated server files**: The Hono server endpoints are no longer needed

## Benefits of the Migration

1. **Better Performance**: Direct database queries instead of HTTP requests
2. **Real-time Capabilities**: Potential for real-time updates with Supabase subscriptions
3. **Better Scalability**: Proper relational database with indexes and views
4. **Data Consistency**: ACID transactions and referential integrity
5. **Easier Analytics**: SQL-based reporting and aggregation queries

## Setup Instructions

1. **Run the schema**: Execute `supabase_schema.sql` in the Supabase SQL Editor
2. **Tables created**:
   - `evaluations` - Main evaluation data
   - `ai_tool_scores` - AI tool scores (normalized)
   - `team_summaries` - View for team aggregations
   - `team_ai_tool_averages` - View for AI tool analysis
   - `ai_tool_category_stats` - View for overall statistics

3. **App automatically connects**: Uses existing Supabase project configuration from `/utils/supabase/info.tsx`

## Data Structure

### Before (KV Store)
```
evaluation:{id} -> { 
  id, teamName, judgeName, scores: { aiToolsScores: {...}, ... }, 
  comments, timestamp, calculated_fields 
}
team:{teamName} -> { teamName, evaluations: [ids], lastUpdated }
```

### After (Relational Database)
```sql
-- Main evaluation record
evaluations: id, team_name, judge_name, solution_description, 
             ex_roles_contribution, learned_new_technique, comments, 
             ai_tools_total, ai_tools_average, total_score, created_at

-- Individual AI tool scores (normalized)
ai_tool_scores: evaluation_id, tool_category, score

-- Views automatically calculate team summaries and averages
```

## API Compatibility

The API interface remains exactly the same, so existing components work without changes:
- `api.submitEvaluation()`
- `api.getEvaluations()`
- `api.getTeamSummary()`
- `api.getTeamEvaluations()`
- `api.deleteEvaluation()`
- `api.healthCheck()`

## Troubleshooting

1. **Connection errors**: Ensure the schema has been run in Supabase SQL Editor
2. **Missing data**: Previous KV store data is not automatically migrated
3. **Permission errors**: Check Supabase RLS policies if enabled

## Future Enhancements

With the proper database foundation, future features could include:
- Real-time dashboard updates using Supabase subscriptions
- Advanced analytics and reporting
- Data export capabilities
- User authentication and team management
- Historical data analysis and trends