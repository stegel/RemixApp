# Remove Team Name Column Migration Guide

This document explains the final step in the team ID migration: removing the legacy team_name column from the evaluations table.

## Overview

After successfully migrating to team_id relationships, this migration removes the redundant team_name column to:

- **Eliminate Data Redundancy**: No more duplicate team name storage
- **Enforce Data Integrity**: All team references must go through proper foreign keys
- **Improve Performance**: Smaller table size and cleaner indexes
- **Simplify Schema**: Single source of truth for team relationships
- **Future-Proof**: Clean foundation for additional features

## Prerequisites

**CRITICAL**: This migration requires that ALL evaluations have team_id assigned. Run these checks first:

```sql
-- Check migration readiness
SELECT 
  COUNT(*) as total_evaluations,
  COUNT(team_id) as evaluations_with_team_id,
  COUNT(*) - COUNT(team_id) as evaluations_missing_team_id,
  ROUND(COUNT(team_id)::numeric / COUNT(*) * 100, 2) as success_percentage
FROM evaluations;
```

**Only proceed if success_percentage is 100%**. If not, run the team_id migration first.

## Migration Steps

### 1. Run Pre-Migration Verification

```sql
\i remove-team-name-migration.sql
```

The script automatically verifies readiness and stops if any evaluations lack team_id.

### 2. Understand What Changes

The migration will:
- Add NOT NULL constraint to team_id
- Add foreign key constraint if missing
- Remove team_name column entirely
- Update all views and functions
- Create helper functions for backward compatibility

### 3. Backend API Changes

The API has been updated to:
- **Remove** team_name from FormData interface
- **Require** team_id in all evaluation operations
- **Validate** team_id exists before accepting evaluations
- **Use** proper joins to get team names for display

### 4. Frontend Changes

The JudgingForm now:
- Only stores team_id (no more team_name)
- Validates team_id is selected (> 0)
- Uses team IDs exclusively for submissions

## Verification Steps

After migration, verify success:

### 1. Check Column Removal
```sql
-- Should return FALSE
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'evaluations' AND column_name = 'team_name'
);
```

### 2. Verify Foreign Key Constraint
```sql
-- Should return TRUE
SELECT EXISTS (
  SELECT 1 FROM information_schema.table_constraints 
  WHERE constraint_name = 'fk_evaluations_team_id' AND table_name = 'evaluations'
);
```

### 3. Test Evaluation Queries
```sql
-- Should work and include team names
SELECT * FROM evaluations_with_team_names LIMIT 5;
```

### 4. Verify Analytics Still Work
Test the admin dashboard analytics to ensure team performance data displays correctly.

## New Database Structure

### Updated Evaluations Table
```sql
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    participant_name VARCHAR(255) NOT NULL,
    team_id INTEGER NOT NULL,  -- Now required with foreign key
    curiosity_score INTEGER NOT NULL CHECK (curiosity_score >= 0 AND curiosity_score <= 4),
    experimentation_score INTEGER NOT NULL CHECK (experimentation_score >= 0 AND experimentation_score <= 4),
    learning_score INTEGER NOT NULL CHECK (learning_score >= 0 AND learning_score <= 4),
    innovation_score INTEGER NOT NULL CHECK (innovation_score >= 0 AND innovation_score <= 4),
    collaboration_score INTEGER NOT NULL CHECK (collaboration_score >= 0 AND collaboration_score <= 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_evaluations_team_id FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);
```

### New Helper View
```sql
-- For queries that need team names
CREATE VIEW evaluations_with_team_names AS
SELECT 
    e.*,
    COALESCE(t.name, 'Team ' || t.team_number, 'Team #' || t.id) as team_name,
    t.location as team_location
FROM evaluations e
JOIN teams t ON e.team_id = t.id;
```

### Helper Function
```sql
-- Get team name by ID
SELECT get_team_name_by_id(123); -- Returns team display name
```

## API Changes

### Evaluation Submission
```json
// OLD (removed team_name)
{
  "participantName": "John Doe",
  "teamName": "Engineering Team",
  "question1": "3",
  ...
}

// NEW (team_id required)
{
  "participantName": "John Doe", 
  "teamId": 5,
  "question1": "3",
  ...
}
```

### Evaluation Response
```json
{
  "id": 123,
  "participant_name": "John Doe",
  "team_id": 5,
  "team_name": "Engineering Team",  // Computed from join
  "team_location": "Americas",      // From team table
  "curiosity_score": 3,
  ...
}
```

## Rollback Procedure

If you need to rollback (not recommended after data entry):

### 1. Re-add team_name Column
```sql
ALTER TABLE evaluations ADD COLUMN team_name VARCHAR(255);

-- Populate from team_id
UPDATE evaluations 
SET team_name = get_team_name_by_id(team_id);

-- Add NOT NULL constraint
ALTER TABLE evaluations ALTER COLUMN team_name SET NOT NULL;
```

### 2. Recreate Index
```sql
CREATE INDEX idx_evaluations_team_name ON evaluations(team_name);
```

### 3. Remove Foreign Key (if desired)
```sql
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS fk_evaluations_team_id;
ALTER TABLE evaluations ALTER COLUMN team_id DROP NOT NULL;
```

## Troubleshooting

### Common Issues

1. **Migration blocked with "evaluations still missing team_id"**
   - Run team_id migration first
   - Check for orphaned evaluations manually

2. **API returns 400 "Valid team ID is required"**
   - Frontend still sending team_name instead of team_id
   - Check JudgingForm component implementation

3. **Analytics showing empty data**
   - View creation may have failed
   - Check PostgreSQL logs for errors
   - Verify teams table has active teams

4. **Frontend form not submitting**
   - Check browser console for validation errors
   - Ensure team is selected (teamId > 0)

## Benefits After Migration

### Performance Improvements
- **Smaller Tables**: Reduced storage footprint
- **Faster Queries**: Integer joins vs string matching
- **Better Indexing**: More efficient team_id indexes

### Data Integrity
- **Referential Integrity**: Foreign keys prevent orphaned records
- **Consistent Names**: Single source of truth for team information
- **Cascade Deletes**: Automatic cleanup when teams are removed

### Maintainability
- **Cleaner Schema**: Clear relationships and constraints
- **Easier Queries**: Proper JOIN syntax instead of string matching
- **Future Features**: Foundation for advanced team management

### Development Benefits
- **Type Safety**: Frontend uses numeric IDs consistently
- **Clear APIs**: Explicit team_id requirements
- **Better Debugging**: Foreign key violations are more descriptive

## Support

If you encounter issues:

1. **Check Migration Logs**: PostgreSQL will show detailed error messages
2. **Verify Prerequisites**: Ensure team_id migration was completed successfully
3. **Test Incrementally**: Start with a backup/staging environment
4. **Monitor Performance**: New structure should be faster, not slower

## Next Steps

After successful migration, consider:

- **Performance Monitoring**: Compare query performance before/after
- **Data Cleanup**: Remove any temporary migration files
- **Documentation Updates**: Update API documentation to reflect changes
- **Team Training**: Brief users on any UI changes (should be minimal)

This completes the transition to a pure team_id based relationship model!