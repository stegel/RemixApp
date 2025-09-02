import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { TeamAnalytics } from '../utils/api';
import { getScoreColor, typographyStyles } from '../utils/ui-helpers';

interface AnalyticsTableProps {
  analytics: TeamAnalytics[];
}

export function AnalyticsTable({ analytics }: AnalyticsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team Name</TableHead>
          <TableHead>Evaluations</TableHead>
          <TableHead>Avg Curiosity</TableHead>
          <TableHead>Avg Experimentation</TableHead>
          <TableHead>Avg Learning</TableHead>
          <TableHead>Avg Innovation</TableHead>
          <TableHead>Avg Collaboration</TableHead>
          <TableHead>Overall Average</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {analytics.map((team) => (
          <TableRow key={team.teamName}>
            <TableCell style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              {team.teamName}
            </TableCell>
            <TableCell>{team.evaluationCount}</TableCell>
            <TableCell>{team.averageScores.curiosity}</TableCell>
            <TableCell>{team.averageScores.experimentation}</TableCell>
            <TableCell>{team.averageScores.learning}</TableCell>
            <TableCell>{team.averageScores.innovation}</TableCell>
            <TableCell>{team.averageScores.collaboration}</TableCell>
            <TableCell>
              <Badge className={getScoreColor(parseFloat(team.averageScores.overall))}>
                {team.averageScores.overall}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}