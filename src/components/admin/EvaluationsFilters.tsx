import React from 'react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface EvaluationsFiltersProps {
  filterTeam: string;
  filterParticipant: string;
  uniqueTeams: string[];
  onTeamChange: (team: string) => void;
  onParticipantChange: (participant: string) => void;
}

export function EvaluationsFilters({ 
  filterTeam, 
  filterParticipant, 
  uniqueTeams, 
  onTeamChange, 
  onParticipantChange 
}: EvaluationsFiltersProps) {
  return (
    <div className="flex space-x-4 mb-6">
      <Input
        placeholder="Filter by participant name..."
        value={filterParticipant}
        onChange={(e) => onParticipantChange(e.target.value)}
        className="max-w-sm border-border"
        style={{ borderRadius: 'var(--radius)' }}
      />
      <Select value={filterTeam} onValueChange={onTeamChange}>
        <SelectTrigger className="max-w-sm border-border" style={{ borderRadius: 'var(--radius)' }}>
          <SelectValue placeholder="Filter by team..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Teams</SelectItem>
          {uniqueTeams.map((team) => (
            <SelectItem key={team} value={team}>{team}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}