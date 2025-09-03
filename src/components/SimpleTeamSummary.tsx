import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { TeamAnalytics } from '../utils/api';
import { getScoreColor, getAILevel, typographyStyles } from '../utils/ui-helpers';
import { ChevronDown, ChevronRight, Copy, CheckCheck } from 'lucide-react';

interface SimpleTeamSummaryProps {
  analytics: TeamAnalytics[];
}

export function SimpleTeamSummary({ analytics }: SimpleTeamSummaryProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Agentic Ace': true,
    'Cognitive Crafter': true,
    'Neural Novice': true,
    'Booting Bot': true,
  });
  const [copiedSections, setCopiedSections] = useState<Record<string, boolean>>({});

  // Group teams by AI level
  const aiLevelOrder = ['Agentic Ace', 'Cognitive Crafter', 'Neural Novice', 'Booting Bot'];
  const groupedTeams = analytics.reduce((groups, team) => {
    const aiLevel = getAILevel(parseFloat(team.averageTotalScore)).level;
    if (!groups[aiLevel]) {
      groups[aiLevel] = [];
    }
    groups[aiLevel].push(team);
    return groups;
  }, {} as Record<string, TeamAnalytics[]>);

  // Sort teams within each group by average total score (descending)
  Object.keys(groupedTeams).forEach((level) => {
    groupedTeams[level].sort((a, b) => 
      parseFloat(b.averageTotalScore) - parseFloat(a.averageTotalScore)
    );
  });

  const toggleSection = (level: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  // Copy function with fallbacks
  const copyToClipboard = (text: string): boolean => {
    try {
      // Method 1: Try modern Clipboard API first (if available and secure context)
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
        return true;
      }

      // Method 2: Fallback to legacy approach with invisible textarea
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (err) {
      console.error('All copy methods failed:', err);
      return false;
    }
  };

  const copyTeamNames = (level: string, teams: TeamAnalytics[]) => {
    const teamNames = teams.map((team) => team.teamName).join('\n');
    
    const success = copyToClipboard(teamNames);
    
    if (success) {
      setCopiedSections((prev) => ({ ...prev, [level]: true }));
      setTimeout(() => {
        setCopiedSections((prev) => ({
          ...prev,
          [level]: false,
        }));
      }, 2000);
    } else {
      // Show error or alternative action
      alert(`Could not copy automatically. Please manually copy these team names:\n\n${teamNames}`);
    }
  };

  const copyAllTeamNames = () => {
    const allTeams = aiLevelOrder
      .filter((level) => groupedTeams[level] && groupedTeams[level].length > 0)
      .map((level) => {
        const teams = groupedTeams[level]
          .map((team) => team.teamName)
          .join('\n');
        return `${level}:\n${teams}`;
      })
      .join('\n\n');

    const success = copyToClipboard(allTeams);
    
    if (success) {
      setCopiedSections((prev) => ({ ...prev, all: true }));
      setTimeout(() => {
        setCopiedSections((prev) => ({ ...prev, all: false }));
      }, 2000);
    } else {
      // Show error or alternative action
      alert(`Could not copy automatically. Please manually copy these team names:\n\n${allTeams}`);
    }
  };

  return (
    <div className="space-y-6">
      {analytics.length === 0 ? (
        <div className="text-center py-8">
          <p style={typographyStyles.muted}>
            No evaluation data available yet.
          </p>
        </div>
      ) : (
        <Card style={{ borderRadius: 'var(--radius-card)' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle style={typographyStyles.h2}>
                  Teams by AI Proficiency Level
                </CardTitle>
                <CardDescription style={typographyStyles.muted}>
                  Teams grouped by AI proficiency with copy functionality for team names
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={copyAllTeamNames}
                className="flex items-center space-x-2"
                style={{ borderRadius: 'var(--radius-button)' }}
              >
                {copiedSections.all ? (
                  <CheckCheck className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>
                  {copiedSections.all ? 'Copied!' : 'Copy All Teams'}
                </span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiLevelOrder.map((level) => {
                const teams = groupedTeams[level];
                if (!teams || teams.length === 0) return null;

                const aiLevelInfo = getAILevel(parseFloat(teams[0].averageTotalScore));
                const isOpen = openSections[level];

                return (
                  <Card key={level} style={{ borderRadius: 'var(--radius)' }}>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleSection(level)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          style={{ borderRadius: 'var(--radius) var(--radius) 0 0' }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {isOpen ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                              <Badge
                                className={aiLevelInfo.color}
                                style={{
                                  borderRadius: 'var(--radius-badge)',
                                  fontWeight: 'var(--font-weight-semibold)',
                                  fontSize: 'var(--text-base)',
                                  padding: '8px 12px',
                                }}
                              >
                                {level}
                              </Badge>
                              <span style={typographyStyles.muted}>
                                {teams.length} team{teams.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyTeamNames(level, teams);
                                }}
                                className="flex items-center space-x-1"
                                style={{ borderRadius: 'var(--radius-button)' }}
                              >
                                {copiedSections[level] ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span style={{ fontSize: 'var(--text-label)' }}>
                                  {copiedSections[level] ? 'Copied!' : 'Copy Names'}
                                </span>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                  Rank
                                </TableHead>
                                <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                  Team Name
                                </TableHead>
                                <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                  # of Evaluations
                                </TableHead>
                                <TableHead style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                  Average Total Score
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {teams.map((team, index) => {
                                const totalScore = parseFloat(team.averageTotalScore);
                                const normalizedScore = totalScore / 5; // Convert from 0-20 scale to 0-4 scale for color coding
                                
                                return (
                                  <TableRow key={team.teamName}>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <span
                                          style={{
                                            fontWeight: 'var(--font-weight-bold)',
                                            color: index === 0 ? 'var(--accent)' : 
                                                   index === 1 ? 'var(--primary)' : 
                                                   index === 2 ? 'var(--chart-3)' : 'var(--foreground)',
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
                                            marginTop: '2px',
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
                                      <div className="flex items-center space-x-2">
                                        <Badge 
                                          className={getScoreColor(normalizedScore)}
                                          style={{ borderRadius: 'var(--radius-badge)' }}
                                        >
                                          {team.averageTotalScore}/20
                                        </Badge>
                                        <span style={{ ...typographyStyles.muted, fontSize: 'var(--text-label)' }}>
                                          ({((totalScore / 20) * 100).toFixed(0)}%)
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}