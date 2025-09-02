import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Evaluation } from '../utils/api';
import { getScoreColor } from '../utils/ui-helpers';

interface EvaluationsTableProps {
  evaluations: Evaluation[];
  onDelete: (id: number) => void;
}

export function EvaluationsTable({ evaluations, onDelete }: EvaluationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Participant</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Curiosity</TableHead>
          <TableHead>Experimentation</TableHead>
          <TableHead>Learning</TableHead>
          <TableHead>Innovation</TableHead>
          <TableHead>Collaboration</TableHead>
          <TableHead style={{ fontWeight: 'var(--font-weight-bold)' }}>Total Score</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {evaluations.map((evaluation) => (
          <TableRow key={evaluation.id}>
            <TableCell>{evaluation.participant_name}</TableCell>
            <TableCell>{evaluation.team_name}</TableCell>
            <TableCell>
              <Badge className={getScoreColor(evaluation.curiosity_score)}>
                {evaluation.curiosity_score}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getScoreColor(evaluation.experimentation_score)}>
                {evaluation.experimentation_score}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getScoreColor(evaluation.learning_score)}>
                {evaluation.learning_score}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getScoreColor(evaluation.innovation_score)}>
                {evaluation.innovation_score}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getScoreColor(evaluation.collaboration_score)}>
                {evaluation.collaboration_score}
              </Badge>
            </TableCell>
            <TableCell>
              {(() => {
                const totalScore = evaluation.curiosity_score + 
                                 evaluation.experimentation_score + 
                                 evaluation.learning_score + 
                                 evaluation.innovation_score + 
                                 evaluation.collaboration_score;
                // Calculate color based on total score out of 20 (5 questions × 4 points each)
                // Convert to 0-4 scale for consistent color coding
                const averageScore = totalScore / 5;
                return (
                  <Badge 
                    className={getScoreColor(averageScore)}
                    style={{ 
                      borderRadius: 'var(--radius-badge)',
                      fontWeight: 'var(--font-weight-bold)'
                    }}
                  >
                    {totalScore}/20
                  </Badge>
                );
              })()}
            </TableCell>
            <TableCell>
              {new Date(evaluation.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button
                onClick={() => onDelete(evaluation.id)}
                variant="destructive"
                size="sm"
                style={{ borderRadius: 'var(--radius-button)' }}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}