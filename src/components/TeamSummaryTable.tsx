import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TeamAnalytics } from '../utils/api';
import { getScoreColor, getAILevel, typographyStyles } from '../utils/ui-helpers';

interface TeamSummaryTableProps {
  analytics: TeamAnalytics[];
}

export function TeamSummaryTable({ analytics }: TeamSummaryTableProps) {
  // Sort teams by average total score (descending) for better visualization
  const sortedAnalytics = [...analytics].sort((a, b) => 
    parseFloat(b.averageTotalScore) - parseFloat(a.averageTotalScore)
  );

  // Calculate overall statistics
  const totalEvaluations = analytics.reduce((sum, team) => sum + team.evaluationCount, 0);
  const averageOverallScore = analytics.length > 0 
    ? (analytics.reduce((sum, team) => sum + parseFloat(team.averageScores.overall), 0) / analytics.length).toFixed(2)
    : '0.00';
  const averageTotalScore = analytics.length > 0
    ? (analytics.reduce((sum, team) => sum + parseFloat(team.averageTotalScore), 0) / analytics.length).toFixed(1)
    : '0.0';
  
  // Calculate AI Level distribution
  const aiLevelCounts = analytics.reduce((counts, team) => {
    const level = getAILevel(parseFloat(team.averageTotalScore)).level;
    counts[level] = (counts[level] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  const topAILevel = Object.entries(aiLevelCounts).reduce((top, [level, count]) => 
    count > (aiLevelCounts[top] || 0) ? level : top, 
  'Neural Novice');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card style={{ borderRadius: 'var(--radius-card)' }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>Total Teams</CardDescription>
            <CardTitle style={{ ...typographyStyles.h2, fontSize: 'var(--text-h1)' }}>
              {analytics.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card style={{ borderRadius: 'var(--radius-card)' }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>Total Evaluations</CardDescription>
            <CardTitle style={{ ...typographyStyles.h2, fontSize: 'var(--text-h1)' }}>
              {totalEvaluations}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card style={{ borderRadius: 'var(--radius-card)' }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>Average Score (All Teams)</CardDescription>
            <CardTitle style={{ ...typographyStyles.h2, fontSize: 'var(--text-h1)' }}>
              <Badge className={getScoreColor(parseFloat(averageOverallScore))} style={{ borderRadius: 'var(--radius-badge)' }}>
                {averageOverallScore}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card style={{ borderRadius: 'var(--radius-card)' }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>Avg Total Score (All Teams)</CardDescription>
            <CardTitle style={{ ...typographyStyles.h2, fontSize: 'var(--text-h1)' }}>
              <Badge className={getScoreColor(parseFloat(averageTotalScore) / 5)} style={{ borderRadius: 'var(--radius-badge)' }}>
                {averageTotalScore}/20
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card style={{ borderRadius: 'var(--radius-card)' }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>Most Common AI Level</CardDescription>
            <CardTitle style={{ ...typographyStyles.h2, fontSize: 'var(--text-h1)' }}>
              <Badge 
                className={getAILevel(0).level === topAILevel ? getAILevel(0).color :
                          getAILevel(6).level === topAILevel ? getAILevel(6).color :
                          getAILevel(11).level === topAILevel ? getAILevel(11).color :
                          getAILevel(16).color} 
                style={{ 
                  borderRadius: 'var(--radius-badge)',
                  fontSize: 'var(--text-label)',
                  padding: '4px 8px'
                }}
              >
                {topAILevel}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Team Summary Table */}
      <Card style={{ borderRadius: 'var(--radius-card)' }}>
        <CardHeader>
          <CardTitle style={typographyStyles.h2}>Team Performance Summary</CardTitle>
          <CardDescription style={typographyStyles.muted}>
            Team performance summary with normalized averages (0-4 scale), total score averages (out of 20), and AI proficiency levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="text-center py-8">
              <p style={typographyStyles.muted}>No evaluation data available yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>Rank</TableHead>
                  <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>Team Name</TableHead>
                  <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>Evaluations</TableHead>
                  <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>Average Total Score</TableHead>
                  <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>Avg Total (Out of 20)</TableHead>
                  <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>AI Level</TableHead>
                  <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAnalytics.map((team, index) => {
                  const score = parseFloat(team.averageScores.overall);
                  const totalScore = parseFloat(team.averageTotalScore);
                  const percentage = ((totalScore / 20) * 100).toFixed(0); // Convert to percentage (out of 20)
                  
                  return (
                    <TableRow key={team.teamName}>
                      <TableCell>
                        <div className="flex items-center">
                          <span 
                            style={{ 
                              fontWeight: 'var(--font-weight-bold)',
                              color: index === 0 ? 'var(--accent)' : 
                                     index === 1 ? 'var(--primary)' : 
                                     index === 2 ? 'var(--chart-3)' : 'var(--foreground)'
                            }}
                          >
                            #{index + 1}
                          </span>
                          {index < 3 && (
                            <span className="ml-1 text-xs">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                            {team.teamName}
                          </div>
                          {team.location && (
                            <div style={{ 
                              ...typographyStyles.muted, 
                              fontSize: 'var(--text-label)',
                              marginTop: '2px'
                            }}>
                              📍 {team.location}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={typographyStyles.muted}>
                        {team.evaluationCount} evaluation{team.evaluationCount !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getScoreColor(score)} 
                          style={{ borderRadius: 'var(--radius-badge)' }}
                        >
                          {team.averageScores.overall}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getScoreColor(parseFloat(team.averageTotalScore) / 5)} 
                          style={{ 
                            borderRadius: 'var(--radius-badge)',
                            fontWeight: 'var(--font-weight-bold)'
                          }}
                        >
                          {team.averageTotalScore}/20
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const aiLevel = getAILevel(parseFloat(team.averageTotalScore));
                          return (
                            <Badge 
                              className={aiLevel.color} 
                              style={{ 
                                borderRadius: 'var(--radius-badge)',
                                fontWeight: 'var(--font-weight-semibold)',
                                fontSize: 'var(--text-label)',
                                padding: '4px 8px'
                              }}
                            >
                              {aiLevel.level}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="h-2 bg-muted rounded-full"
                            style={{ 
                              width: '60px',
                              borderRadius: 'var(--radius)'
                            }}
                          >
                            <div 
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: totalScore >= 16 ? 'var(--accent)' : 
                                                totalScore >= 12 ? 'var(--primary)' : 
                                                totalScore >= 8 ? 'var(--chart-3)' : 'var(--destructive)',
                                borderRadius: 'var(--radius)'
                              }}
                            />
                          </div>
                          <span style={{ 
                            ...typographyStyles.muted,
                            fontSize: 'var(--text-label)'
                          }}>
                            {percentage}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}