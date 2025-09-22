import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-990f6b7c`;

export interface FormData {
  participantName: string;
  teamId: number; // Team ID reference (required)
  question1: string;
  question2: string;
  question3: string;
  question4: string;
  question5: string;
}

export interface Evaluation {
  id: number;
  participant_name: string;
  team_id: number; // Team ID field (required)
  team_name?: string; // Computed team name from join/function
  team_location?: string; // Team location from join
  curiosity_score: number;
  experimentation_score: number;
  learning_score: number;
  innovation_score: number;
  collaboration_score: number;
  created_at: string;
  updated_at?: string;
}

// Location options
export const LOCATION_OPTIONS = ['Americas', 'Amsterdam', 'Hyderabad'] as const;
export type LocationOption = typeof LOCATION_OPTIONS[number];

export interface Team {
  id: number;
  team_number?: number; // Optional for backward compatibility
  name?: string; // Optional in new schema
  location?: LocationOption;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamInput {
  teamNumber?: number; // Optional for backward compatibility
  name?: string;
  location?: LocationOption;
  isActive?: boolean;
}

export interface CSVTeamInput {
  teamNumber: number;
  name?: string;
  location?: LocationOption;
}

export interface TeamAnalytics {
  teamName: string;
  location?: string;
  evaluationCount: number;
  averageScores: {
    curiosity: string;
    experimentation: string;
    learning: string;
    innovation: string;
    collaboration: string;
    overall: string;
  };
  averageTotalScore: string; // Average of total scores (out of 20)
}

export const submitEvaluation = async (formData: FormData): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/evaluations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(formData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to submit evaluation');
  }

  return response.json();
};

export const fetchEvaluations = async (filterTeam?: string, filterParticipant?: string): Promise<Evaluation[]> => {
  const queryParams = new URLSearchParams();
  if (filterTeam) queryParams.append('team', filterTeam);
  if (filterParticipant) queryParams.append('participant', filterParticipant);

  const response = await fetch(
    `${API_BASE_URL}/evaluations?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch evaluations');
  }

  const result = await response.json();
  return result.data || [];
};

export const fetchAnalytics = async (): Promise<TeamAnalytics[]> => {
  const response = await fetch(
    `${API_BASE_URL}/analytics/teams`,
    {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  const result = await response.json();
  return result.data || [];
};

export const deleteEvaluation = async (id: number): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/evaluations/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete evaluation');
  }
};

export const deleteAllEvaluations = async (): Promise<{ deletedCount: number; message: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/evaluations`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete all evaluations');
  }

  const result = await response.json();
  return {
    deletedCount: result.deletedCount,
    message: result.message
  };
};

// TEAM API FUNCTIONS

export const createTeam = async (teamData: TeamInput): Promise<Team> => {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(teamData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create team');
  }

  const result = await response.json();
  return result.data;
};

export const fetchTeams = async (activeOnly: boolean = false): Promise<Team[]> => {
  const queryParams = new URLSearchParams();
  if (activeOnly) queryParams.append('active', 'true');

  const response = await fetch(
    `${API_BASE_URL}/teams?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch teams');
  }

  const result = await response.json();
  return result.data || [];
};

export const updateTeam = async (id: number, teamData: TeamInput): Promise<Team> => {
  const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(teamData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update team');
  }

  const result = await response.json();
  return result.data;
};

export const updateTeamNameByNumber = async (teamNumber: number, newName: string): Promise<Team> => {
  const response = await fetch(`${API_BASE_URL}/teams/by-number/${teamNumber}/name`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({ name: newName })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update team name');
  }

  const result = await response.json();
  return result.data;
};

export const deleteTeam = async (id: number): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/teams/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete team');
  }
};

export const deleteAllTeams = async (): Promise<{ deletedCount: number; message: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/teams`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete all teams');
  }

  const result = await response.json();
  return {
    deletedCount: result.deletedCount,
    message: result.message
  };
};

export const importTeamsFromCSV = async (teams: CSVTeamInput[]): Promise<{ success: number; errors: string[] }> => {
  const response = await fetch(`${API_BASE_URL}/teams/import-csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({ teams })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to import teams');
  }

  return response.json();
};

// Helper function to get display name for a team
export const getTeamDisplayName = (team: Team): string => {
  if (team.name) {
    return team.name;
  }
  if (team.team_number) {
    return `Team ${team.team_number}`;
  }
  return `Team #${team.id}`;
};

// SCHEMA MANAGEMENT FUNCTIONS

export const reloadSchemaCache = async (): Promise<{ success: boolean; message: string; method?: string }> => {
  const response = await fetch(`${API_BASE_URL}/reload-schema`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to reload schema cache');
  }

  return await response.json();
};

export interface SchemaStatus {
  success: boolean;
  ready: boolean;
  checks: {
    teams: boolean;
    evaluations: boolean;
    functions: boolean;
  };
  message: string;
  error?: string;
}

export const checkSchemaStatus = async (): Promise<SchemaStatus> => {
  const response = await fetch(`${API_BASE_URL}/schema-status`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to check schema status');
  }

  return await response.json();
};