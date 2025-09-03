import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { TeamAnalytics } from "../utils/api";
import {
  getScoreColor,
  getAILevel,
  typographyStyles,
} from "../utils/ui-helpers";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  CheckCheck,
} from "lucide-react";

interface TeamSummaryTableProps {
  analytics: TeamAnalytics[];
  filteredLocation?: string;
}

export function TeamSummaryTable({
  analytics,
  filteredLocation,
}: TeamSummaryTableProps) {
  const [openSections, setOpenSections] = useState<
    Record<string, boolean>
  >({
    "Agentic Ace": true,
    "Cognitive Crafter": true,
    "Neural Novice": true,
    "Booting Bot": true,
  });
  const [copiedSections, setCopiedSections] = useState<
    Record<string, boolean>
  >({});

  // Group teams by AI level
  const aiLevelOrder = [
    "Agentic Ace",
    "Cognitive Crafter",
    "Neural Novice",
    "Booting Bot",
  ];
  const groupedTeams = analytics.reduce(
    (groups, team) => {
      const aiLevel = getAILevel(
        parseFloat(team.averageTotalScore),
      ).level;
      if (!groups[aiLevel]) {
        groups[aiLevel] = [];
      }
      groups[aiLevel].push(team);
      return groups;
    },
    {} as Record<string, TeamAnalytics[]>,
  );

  // Sort teams within each group by average total score (descending)
  Object.keys(groupedTeams).forEach((level) => {
    groupedTeams[level].sort(
      (a, b) =>
        parseFloat(b.averageTotalScore) -
        parseFloat(a.averageTotalScore),
    );
  });

  // Calculate overall statistics
  const totalEvaluations = analytics.reduce(
    (sum, team) => sum + team.evaluationCount,
    0,
  );
  const averageOverallScore =
    analytics.length > 0
      ? (
          analytics.reduce(
            (sum, team) =>
              sum + parseFloat(team.averageScores.overall),
            0,
          ) / analytics.length
        ).toFixed(2)
      : "0.00";
  const averageTotalScore =
    analytics.length > 0
      ? (
          analytics.reduce(
            (sum, team) =>
              sum + parseFloat(team.averageTotalScore),
            0,
          ) / analytics.length
        ).toFixed(1)
      : "0.0";

  // Calculate AI Level distribution
  const aiLevelCounts = analytics.reduce(
    (counts, team) => {
      const level = getAILevel(
        parseFloat(team.averageTotalScore),
      ).level;
      counts[level] = (counts[level] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );

  const topAILevel = Object.entries(aiLevelCounts).reduce(
    (top, [level, count]) =>
      count > (aiLevelCounts[top] || 0) ? level : top,
    "Neural Novice",
  );

  // Calculate location-based statistics
  const locationStats = analytics.reduce(
    (stats, team) => {
      const location = team.location || "Unknown";
      if (!stats[location]) {
        stats[location] = {
          count: 0,
          totalEvaluations: 0,
          totalScore: 0,
          teams: [],
        };
      }
      stats[location].count += 1;
      stats[location].totalEvaluations += team.evaluationCount;
      stats[location].totalScore += parseFloat(
        team.averageScores.overall,
      );
      stats[location].teams.push(team);
      return stats;
    },
    {} as Record<
      string,
      {
        count: number;
        totalEvaluations: number;
        totalScore: number;
        teams: TeamAnalytics[];
      }
    >,
  );

  const hasMultipleLocations =
    Object.keys(locationStats).length > 1;

  const toggleSection = (level: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  // Robust copy function with fallbacks
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
    const teamNames = teams
      .map((team) => team.teamName)
      .join("\n");
    
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
      .filter(
        (level) =>
          groupedTeams[level] && groupedTeams[level].length > 0,
      )
      .map((level) => {
        const teams = groupedTeams[level]
          .map((team) => team.teamName)
          .join("\n");
        return `${level}:\n${teams}`;
      })
      .join("\n\n");

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
      {/* Location Summary (when showing all locations) */}
      {hasMultipleLocations && (
        <Card style={{ borderRadius: "var(--radius-card)" }}>
          <CardHeader>
            <CardTitle style={typographyStyles.h2}>
              Summary by Location
            </CardTitle>
            <CardDescription style={typographyStyles.muted}>
              Team performance breakdown by geographic location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(locationStats)
                .sort(
                  (a, b) =>
                    b[1].totalScore / b[1].count -
                    a[1].totalScore / a[1].count,
                )
                .map(([location, stats]) => {
                  const avgScore = (
                    stats.totalScore / stats.count
                  ).toFixed(2);
                  return (
                    <div
                      key={location}
                      className="p-4 rounded-lg border border-border"
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4
                          style={{
                            ...typographyStyles.h4,
                            fontWeight:
                              "var(--font-weight-semibold)",
                          }}
                        >
                          📍 {location}
                        </h4>
                        <Badge
                          className={getScoreColor(
                            parseFloat(avgScore),
                          )}
                          style={{
                            borderRadius: "var(--radius-badge)",
                          }}
                        >
                          {avgScore}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span style={typographyStyles.muted}>
                            Teams:
                          </span>
                          <span style={typographyStyles.body}>
                            {stats.count}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={typographyStyles.muted}>
                            Evaluations:
                          </span>
                          <span style={typographyStyles.body}>
                            {stats.totalEvaluations}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card style={{ borderRadius: "var(--radius-card)" }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>
              {filteredLocation &&
              filteredLocation !== "__all__"
                ? `Teams in ${filteredLocation}`
                : "Total Teams"}
            </CardDescription>
            <CardTitle
              style={{
                ...typographyStyles.h2,
                fontSize: "var(--text-h1)",
              }}
            >
              {analytics.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card style={{ borderRadius: "var(--radius-card)" }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>
              Total Evaluations
            </CardDescription>
            <CardTitle
              style={{
                ...typographyStyles.h2,
                fontSize: "var(--text-h1)",
              }}
            >
              {totalEvaluations}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card style={{ borderRadius: "var(--radius-card)" }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>
              {filteredLocation &&
              filteredLocation !== "__all__"
                ? `Average Score (${filteredLocation})`
                : "Average Score (All Teams)"}
            </CardDescription>
            <CardTitle
              style={{
                ...typographyStyles.h2,
                fontSize: "var(--text-h1)",
              }}
            >
              <Badge
                className={getScoreColor(
                  parseFloat(averageOverallScore),
                )}
                style={{ borderRadius: "var(--radius-badge)" }}
              >
                {averageOverallScore}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card style={{ borderRadius: "var(--radius-card)" }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>
              {filteredLocation &&
              filteredLocation !== "__all__"
                ? `Avg Total Score (${filteredLocation})`
                : "Avg Total Score (All Teams)"}
            </CardDescription>
            <CardTitle
              style={{
                ...typographyStyles.h2,
                fontSize: "var(--text-h1)",
              }}
            >
              <Badge
                className={getScoreColor(
                  parseFloat(averageTotalScore) / 5,
                )}
                style={{ borderRadius: "var(--radius-badge)" }}
              >
                {averageTotalScore}/20
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card style={{ borderRadius: "var(--radius-card)" }}>
          <CardHeader className="pb-2">
            <CardDescription style={typographyStyles.muted}>
              Most Common AI Level
            </CardDescription>
            <CardTitle
              style={{
                ...typographyStyles.h2,
                fontSize: "var(--text-h1)",
              }}
            >
              <Badge
                className={
                  getAILevel(0).level === topAILevel
                    ? getAILevel(0).color
                    : getAILevel(6).level === topAILevel
                      ? getAILevel(6).color
                      : getAILevel(11).level === topAILevel
                        ? getAILevel(11).color
                        : getAILevel(16).color
                }
                style={{
                  borderRadius: "var(--radius-badge)",
                  fontSize: "var(--text-label)",
                  padding: "4px 8px",
                }}
              >
                {topAILevel}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Teams Grouped by AI Level */}
      <Card style={{ borderRadius: "var(--radius-card)" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={typographyStyles.h2}>
                Teams by AI Proficiency Level
                {filteredLocation &&
                  filteredLocation !== "__all__" && (
                    <span
                      style={{
                        ...typographyStyles.muted,
                        fontSize: "var(--text-base)",
                        fontWeight:
                          "var(--font-weight-regular)",
                      }}
                    >
                      {" "}
                      — {filteredLocation}
                    </span>
                  )}
              </CardTitle>
              <CardDescription style={typographyStyles.muted}>
                Teams organized by AI proficiency levels with
                copy functionality for presentations
                {filteredLocation &&
                  filteredLocation !== "__all__" &&
                  ` for ${filteredLocation} teams`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={copyAllTeamNames}
              className="flex items-center space-x-2"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {copiedSections.all ? (
                <CheckCheck className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>
                {copiedSections.all
                  ? "Copied!"
                  : "Copy All Teams"}
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="text-center py-8">
              <p style={typographyStyles.muted}>
                No evaluation data available yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {aiLevelOrder.map((level) => {
                const teams = groupedTeams[level];
                if (!teams || teams.length === 0) return null;

                const aiLevelInfo = getAILevel(
                  parseFloat(teams[0].averageTotalScore),
                );
                const isOpen = openSections[level];

                return (
                  <Card
                    key={level}
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleSection(level)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          style={{
                            borderRadius:
                              "var(--radius) var(--radius) 0 0",
                          }}
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
                                  borderRadius:
                                    "var(--radius-badge)",
                                  fontWeight:
                                    "var(--font-weight-semibold)",
                                  fontSize: "var(--text-base)",
                                  padding: "8px 12px",
                                }}
                              >
                                {level}
                              </Badge>
                              <span
                                style={typographyStyles.muted}
                              >
                                {teams.length} team
                                {teams.length !== 1 ? "s" : ""}
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
                                style={{
                                  borderRadius:
                                    "var(--radius-button)",
                                }}
                              >
                                {copiedSections[level] ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span
                                  style={{
                                    fontSize:
                                      "var(--text-label)",
                                  }}
                                >
                                  {copiedSections[level]
                                    ? "Copied!"
                                    : "Copy Names"}
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
                                <TableHead
                                  style={{
                                    fontWeight:
                                      "var(--font-weight-semibold)",
                                  }}
                                >
                                  Rank
                                </TableHead>
                                <TableHead
                                  style={{
                                    fontWeight:
                                      "var(--font-weight-semibold)",
                                  }}
                                >
                                  Team Name
                                </TableHead>
                                <TableHead
                                  style={{
                                    fontWeight:
                                      "var(--font-weight-semibold)",
                                  }}
                                >
                                  Evaluations
                                </TableHead>
                                <TableHead
                                  style={{
                                    fontWeight:
                                      "var(--font-weight-semibold)",
                                  }}
                                >
                                  Average Total Score
                                </TableHead>
                                <TableHead
                                  style={{
                                    fontWeight:
                                      "var(--font-weight-semibold)",
                                  }}
                                >
                                  Avg Total (Out of 20)
                                </TableHead>
                                <TableHead
                                  style={{
                                    fontWeight:
                                      "var(--font-weight-semibold)",
                                  }}
                                >
                                  Performance
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {teams.map((team, index) => {
                                const score = parseFloat(
                                  team.averageScores.overall,
                                );
                                const totalScore = parseFloat(
                                  team.averageTotalScore,
                                );
                                const percentage = (
                                  (totalScore / 20) *
                                  100
                                ).toFixed(0);

                                return (
                                  <TableRow key={team.teamName}>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <span
                                          style={{
                                            fontWeight:
                                              "var(--font-weight-bold)",
                                            color:
                                              index === 0
                                                ? "var(--accent)"
                                                : index === 1
                                                  ? "var(--primary)"
                                                  : index === 2
                                                    ? "var(--chart-3)"
                                                    : "var(--foreground)",
                                          }}
                                        >
                                          #{index + 1}
                                        </span>
                                        {index < 3 && (
                                          <span className="ml-1 text-xs">
                                            {index === 0
                                              ? "🥇"
                                              : index === 1
                                                ? "🥈"
                                                : "🥉"}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div
                                          style={{
                                            fontWeight:
                                              "var(--font-weight-semibold)",
                                          }}
                                        >
                                          {team.teamName}
                                        </div>
                                        {team.location && (
                                          <div
                                            style={{
                                              ...typographyStyles.muted,
                                              fontSize:
                                                "var(--text-label)",
                                              marginTop: "2px",
                                            }}
                                          >
                                            📍 {team.location}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell
                                      style={
                                        typographyStyles.muted
                                      }
                                    >
                                      {team.evaluationCount}{" "}
                                      evaluation
                                      {team.evaluationCount !==
                                      1
                                        ? "s"
                                        : ""}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        className={getScoreColor(
                                          score,
                                        )}
                                        style={{
                                          borderRadius:
                                            "var(--radius-badge)",
                                        }}
                                      >
                                        {
                                          team.averageScores
                                            .overall
                                        }
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        className={getScoreColor(
                                          parseFloat(
                                            team.averageTotalScore,
                                          ) / 5,
                                        )}
                                        style={{
                                          borderRadius:
                                            "var(--radius-badge)",
                                          fontWeight:
                                            "var(--font-weight-bold)",
                                        }}
                                      >
                                        {team.averageTotalScore}
                                        /20
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <div
                                          className="h-2 bg-muted rounded-full"
                                          style={{
                                            width: "60px",
                                            borderRadius: "var(--radius)",
                                          }}
                                        >
                                          <div
                                            className="h-2 rounded-full transition-all duration-300"
                                            style={{
                                              width: `${percentage}%`,
                                              backgroundColor:
                                                totalScore >= 16
                                                  ? "var(--accent)"
                                                  : totalScore >= 12
                                                    ? "var(--primary)"
                                                    : totalScore >= 8
                                                      ? "var(--chart-3)"
                                                      : "var(--destructive)",
                                              borderRadius: "var(--radius)",
                                            }}
                                          />
                                        </div>
                                        <span
                                          style={{
                                            ...typographyStyles.muted,
                                            fontSize: "var(--text-label)",
                                          }}
                                        >
                                          {percentage}%
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}