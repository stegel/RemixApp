export interface Team {
  id: string;
  team_number: number;
  team_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Display team in the format: "Team Name" or "Team Number" if no name
 */
export function getTeamDisplayName(teamNumber: number, teamName?: string): string {
  return teamName && teamName.trim() ? teamName.trim() : `Team ${teamNumber}`;
}

/**
 * Get the sort key for a team (prioritizes name, falls back to number)
 */
export function getTeamSortKey(teamNumber: number, teamName?: string): string {
  return teamName && teamName.trim() ? teamName.trim().toLowerCase() : `team ${teamNumber.toString().padStart(3, '0')}`;
}