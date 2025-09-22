import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TeamAnalytics } from '../utils/api';
import { getScoreColor, typographyStyles } from '../utils/ui-helpers';

interface AnalyticsTableProps {
  analytics: TeamAnalytics[];
}

export function AnalyticsTable({ analytics }: AnalyticsTableProps) {
  // Calculate overall averages across all teams (weighted by evaluation count)
  const calculateOverallAverages = () => {
    if (analytics.length === 0) {
      return {
        totalEvaluations: 0,
        curiosity: '0.00',
        experimentation: '0.00',
        learning: '0.00',
        innovation: '0.00',
        collaboration: '0.00',
        overall: '0.00'
      };
    }

    let totalEvaluations = 0;
    let weightedCuriosity = 0;
    let weightedExperimentation = 0;
    let weightedLearning = 0;
    let weightedInnovation = 0;
    let weightedCollaboration = 0;
    let weightedOverall = 0;

    analytics.forEach(team => {
      const count = team.evaluationCount;
      totalEvaluations += count;
      weightedCuriosity += parseFloat(team.averageScores.curiosity) * count;
      weightedExperimentation += parseFloat(team.averageScores.experimentation) * count;
      weightedLearning += parseFloat(team.averageScores.learning) * count;
      weightedInnovation += parseFloat(team.averageScores.innovation) * count;
      weightedCollaboration += parseFloat(team.averageScores.collaboration) * count;
      weightedOverall += parseFloat(team.averageScores.overall) * count;
    });

    return {
      totalEvaluations,
      curiosity: (weightedCuriosity / totalEvaluations).toFixed(2),
      experimentation: (weightedExperimentation / totalEvaluations).toFixed(2),
      learning: (weightedLearning / totalEvaluations).toFixed(2),
      innovation: (weightedInnovation / totalEvaluations).toFixed(2),
      collaboration: (weightedCollaboration / totalEvaluations).toFixed(2),
      overall: (weightedOverall / totalEvaluations).toFixed(2)
    };
  };

  const overallAverages = calculateOverallAverages();

  return (
    <div className="space-y-6">
      {/* Overall Summary Card */}
      <Card style={{ borderRadius: 'var(--radius-card)' }}>
        <CardHeader>
          <CardTitle style={typographyStyles.h2}>
            Overall Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div style={{ 
                ...typographyStyles.label, 
                color: 'var(--muted-foreground)',
                marginBottom: '4px'
              }}>
                Total Evaluations
              </div>
              <div style={{
                ...typographyStyles.h2,
                color: 'var(--primary)'
              }}>
                {overallAverages.totalEvaluations}
              </div>
            </div>
            <div className="text-center">
              <div style={{ 
                ...typographyStyles.label, 
                color: 'var(--muted-foreground)',
                marginBottom: '4px'
              }}>
                Teams Evaluated
              </div>
              <div style={{
                ...typographyStyles.h2,
                color: 'var(--primary)'
              }}>
                {analytics.length}
              </div>
            </div>
            <div className="text-center">
              <div style={{ 
                ...typographyStyles.label, 
                color: 'var(--muted-foreground)',
                marginBottom: '4px'
              }}>
                Overall Average Score
              </div>
              <Badge 
                className={`text-lg px-3 py-1 ${getScoreColor(parseFloat(overallAverages.overall))}`}
                style={{ borderRadius: 'var(--radius-badge)' }}
              >
                {overallAverages.overall}
              </Badge>
            </div>
            <div className="text-center">
              <div style={{ 
                ...typographyStyles.label, 
                color: 'var(--muted-foreground)',
                marginBottom: '4px'
              }}>
                Performance Level
              </div>
              <div style={{
                ...typographyStyles.body,
                color: 'var(--foreground)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {parseFloat(overallAverages.overall) >= 3.2 ? 'Excellent' :
                 parseFloat(overallAverages.overall) >= 2.0 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>

          {/* Category Averages */}
          <div className="mt-6">
            <h4 style={{ 
              ...typographyStyles.h4, 
              marginBottom: '12px',
              color: 'var(--foreground)'
            }}>
              Category Averages
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center">
                <div style={{ 
                  ...typographyStyles.label, 
                  color: 'var(--muted-foreground)',
                  marginBottom: '4px'
                }}>
                  Curiosity
                </div>
                <Badge 
                  className={`${getScoreColor(parseFloat(overallAverages.curiosity))}`}
                  style={{ borderRadius: 'var(--radius-badge)' }}
                >
                  {overallAverages.curiosity}
                </Badge>
              </div>
              <div className="text-center">
                <div style={{ 
                  ...typographyStyles.label, 
                  color: 'var(--muted-foreground)',
                  marginBottom: '4px'
                }}>
                  Experimentation
                </div>
                <Badge 
                  className={`${getScoreColor(parseFloat(overallAverages.experimentation))}`}
                  style={{ borderRadius: 'var(--radius-badge)' }}
                >
                  {overallAverages.experimentation}
                </Badge>
              </div>
              <div className="text-center">
                <div style={{ 
                  ...typographyStyles.label, 
                  color: 'var(--muted-foreground)',
                  marginBottom: '4px'
                }}>
                  Learning
                </div>
                <Badge 
                  className={`${getScoreColor(parseFloat(overallAverages.learning))}`}
                  style={{ borderRadius: 'var(--radius-badge)' }}
                >
                  {overallAverages.learning}
                </Badge>
              </div>
              <div className="text-center">
                <div style={{ 
                  ...typographyStyles.label, 
                  color: 'var(--muted-foreground)',
                  marginBottom: '4px'
                }}>
                  Innovation
                </div>
                <Badge 
                  className={`${getScoreColor(parseFloat(overallAverages.innovation))}`}
                  style={{ borderRadius: 'var(--radius-badge)' }}
                >
                  {overallAverages.innovation}
                </Badge>
              </div>
              <div className="text-center">
                <div style={{ 
                  ...typographyStyles.label, 
                  color: 'var(--muted-foreground)',
                  marginBottom: '4px'
                }}>
                  Collaboration
                </div>
                <Badge 
                  className={`${getScoreColor(parseFloat(overallAverages.collaboration))}`}
                  style={{ borderRadius: 'var(--radius-badge)' }}
                >
                  {overallAverages.collaboration}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Team Analytics Table */}
      <Card style={{ borderRadius: 'var(--radius-card)' }}>
        <CardHeader>
          <CardTitle style={typographyStyles.h2}>
            Individual Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}