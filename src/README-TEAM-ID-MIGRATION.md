# Team ID Migration Guide

This document explains the migration from team name-based relationships to team ID-based relationships in the AI in The Mix judging system.

## Overview

The migration updates the database relationship between teams and evaluations to use team IDs instead of team names. This provides:

- **Better data integrity**: Foreign key constraints ensure referential integrity
- **Improved performance**: Integer-based joins are faster than string-based joins
- **Cleaner data model**: Eliminates duplicate team name issues
- **Future-proofing**: Makes it easier to rename teams without breaking historical data

## Migration Steps

### 1. Database Migration

Run the migration script to update your database schema:

```sql
-- Execute the migration script
\i team-id-migration.sql
```

The migration script will:
1. Add `team_id` column to evaluations table
2. Migrate existing data to use team IDs
3. Create missing teams for orphaned evaluations
4. Update database views and functions
5. Create new indexes for performance

### 2. Backend Updates

The backend has been updated to:
- Accept both `teamId` and `teamName` in evaluation submissions
- Maintain backward compatibility with existing data
- Use team ID lookups for better performance
- Handle both old and new schema structures gracefully

### 3. Frontend Updates

The judging form now:
- Stores team ID when a team is selected
- Passes both team ID and team name to the backend
- Maintains the same user experience

### 4. Verification Steps

After running the migration, verify:

1. **Check migration success**:
   ```sql
   SELECT 
     COUNT(*) as total_evaluations,
     COUNT(team_id) as evaluations_with_team_id,
     ROUND(COUNT(team_id)::numeric / COUNT(*) * 100, 2) as success_percentage
   FROM evaluations;
   ```

2. **Verify team relationships**:
   ```sql
   SELECT 
     t.name as team_name,
     COUNT(e.id) as evaluation_count
   FROM teams t
   LEFT JOIN evaluations e ON t.id = e.team_id
   GROUP BY t.id, t.name
   ORDER BY evaluation_count DESC;
   ```

3. **Check for orphaned evaluations**:
   ```sql
   SELECT COUNT(*) as orphaned_evaluations
   FROM evaluations 
   WHERE team_id IS NULL;
   ```

## Rollback Plan

If you need to rollback the migration:

1. **Remove team_id column**:
   ```sql
   ALTER TABLE evaluations DROP COLUMN IF EXISTS team_id;
   ```

2. **Restore original view**:
   ```sql
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
   ```

## Troubleshooting

### Common Issues

1. **Migration fails with permission errors**:
   - Ensure you're running as a superuser or service_role
   - Check RLS policies aren't blocking the migration

2. **Some evaluations don't get team_id assigned**:
   - Check team names for exact matches
   - Review the migration log for unmatched team names
   - Manually create missing teams if needed

3. **Frontend shows "Loading teams..." indefinitely**:
   - Verify team endpoint is working
   - Check browser console for API errors
   - Refresh the schema cache via admin dashboard

### Performance Considerations

- The migration creates new indexes for team_id lookups
- Analytics queries will be faster with team_id joins
- Consider adding composite indexes if you have large datasets

## Post-Migration Cleanup (Optional)

After successful migration and verification:

1. **Add NOT NULL constraint**:
   ```sql
   ALTER TABLE evaluations ALTER COLUMN team_id SET NOT NULL;
   ```

2. **Add foreign key constraint**:
   ```sql
   ALTER TABLE evaluations ADD CONSTRAINT fk_evaluations_team_id 
     FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
   ```

3. **Remove legacy index** (if desired):
   ```sql
   DROP INDEX IF EXISTS idx_evaluations_team_name;
   ```

## Benefits After Migration

- **Data Consistency**: Foreign key constraints prevent invalid team references
- **Better Performance**: Integer-based joins are significantly faster
- **Easier Maintenance**: Team renames don't break historical evaluations
- **Cleaner Analytics**: More reliable team-based reporting
- **Future Features**: Enables advanced team management features

## Support

If you encounter issues during migration:

1. Check the migration logs in PostgreSQL
2. Verify all prerequisites are met
3. Test on a backup/staging environment first
4. Contact system administrator if problems persist