import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { RefreshCw, Trophy, Users, Star, Cpu, GraduationCap, UserCheck, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api, TeamSummary, Evaluation, AI_TOOLS_CATEGORIES, EVALUATION_SCALE_VALUES } from "../utils/api";

export function ResultsDashboard() {
  const [teamSummaries, setTeamSummaries] = useState<TeamSummary[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      // First test if server is responsive
      console.log("Testing server health...");
      const healthResult = await api.healthCheck();
      console.log("Server health check successful:", healthResult);

      console.log("Fetching team summary and evaluations...");
      const [summaryResult, evaluationsResult] = await Promise.all([
        api.getTeamSummary(),
        api.getEvaluations()
      ]);

      console.log("Team summary result:", summaryResult);
      console.log("Evaluations result:", evaluationsResult);

      setTeamSummaries(summaryResult.teams || []);
      setAllEvaluations(evaluationsResult.evaluations || []);
      
      if (summaryResult.teams?.length === 0 && evaluationsResult.evaluations?.length === 0) {
        toast.info("No evaluation data found. Submit some evaluations to see results!");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load data: ${errorMessage}`);
      toast.error("Failed to load results data. Please check the server connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    if (!error) {
      toast.success("Data refreshed successfully");
    }
  };

  const testConnection = async () => {
    try {
      setError(null);
      console.log("Testing connection to server...");
      const result = await api.healthCheck();
      console.log("Connection test successful:", result);
      toast.success("Server connection successful!");
    } catch (error) {
      console.error("Connection test failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setError(`Connection test failed: ${errorMessage}`);
      toast.error("Server connection failed. Please check if the server is running.");
    }
  };

  const formatScore = (score: number, decimals: number = 1) => score.toFixed(decimals);

  const getEvaluationLabel = (value: number) => {
    const labelMap = {
      [EVALUATION_SCALE_VALUES.didNotDemonstrate]: 'Did not demonstrate',
      [EVALUATION_SCALE_VALUES.basic]: 'Basic',
      [EVALUATION_SCALE_VALUES.thoughtful]: 'Thoughtful',
      [EVALUATION_SCALE_VALUES.extraordinary]: 'Extraordinary'
    };
    return labelMap[Math.round(value)] || 'Did not demonstrate';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Star className="w-5 h-5 text-gray-400" />;
      case 3: return <Star className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm">{rank}</span>;
    }
  };

  const getTopLearningTeam = () => {
    if (teamSummaries.length === 0) return null;
    return teamSummaries.reduce((top, team) => 
      team.learnedNewTechniquePercentage > top.learnedNewTechniquePercentage ? team : top
    );
  };

  const getTopSolutionTeam = () => {
    if (teamSummaries.length === 0) return null;
    return teamSummaries.reduce((top, team) => 
      team.averageScores.solutionDescription > top.averageScores.solutionDescription ? team : top
    );
  };

  const getTopExRolesTeam = () => {
    if (teamSummaries.length === 0) return null;
    return teamSummaries.reduce((top, team) => 
      team.averageScores.exRolesContribution > top.averageScores.exRolesContribution ? team : top
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Results Dashboard</h2>
            <p className="text-muted-foreground">
              View team rankings and evaluation summaries
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={testConnection} variant="outline">
              Test Connection
            </Button>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 text-destructive">
              <AlertCircle className="w-8 h-8" />
              <div>
                <h3>Connection Error</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure the server is running and accessible. Try refreshing the page or testing the connection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topLearningTeam = getTopLearningTeam();
  const topSolutionTeam = getTopSolutionTeam();
  const topExRolesTeam = getTopExRolesTeam();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Results Dashboard</h2>
          <p className="text-muted-foreground">
            View team rankings and evaluation summaries
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={testConnection} variant="outline" size="sm">
            Test Connection
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools Detail</TabsTrigger>
          <TabsTrigger value="solution">Solution Clarity</TabsTrigger>
          <TabsTrigger value="ex-roles">EX Roles Impact</TabsTrigger>
          <TabsTrigger value="learning">Learning Impact</TabsTrigger>
          <TabsTrigger value="evaluations">All Evaluations</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-2xl">{teamSummaries.length}</p>
                    <p className="text-sm text-muted-foreground">Teams</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Star className="w-8 h-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-2xl">{allEvaluations.length}</p>
                    <p className="text-sm text-muted-foreground">Total Evaluations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Cpu className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-2xl">
                      {teamSummaries.length > 0 ? formatScore(teamSummaries[0].averageScores.aiToolsAverage) : '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Top AI Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-2xl">
                      {topSolutionTeam ? getEvaluationLabel(topSolutionTeam.averageScores.solutionDescription) : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Top Solution</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <UserCheck className="w-8 h-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-2xl">
                      {topExRolesTeam ? getEvaluationLabel(topExRolesTeam.averageScores.exRolesContribution) : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Top EX Roles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <GraduationCap className="w-8 h-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-2xl">
                      {topLearningTeam ? formatScore(topLearningTeam.learnedNewTechniquePercentage, 0) : '0'}%
                    </p>
                    <p className="text-sm text-muted-foreground">Top Learning</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {teamSummaries.map((team, index) => (
              <Card key={team.teamName}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(index + 1)}
                      <div>
                        <h3>{team.teamName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {team.evaluationCount} evaluation{team.evaluationCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl">{formatScore(team.averageScores.total)}</p>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>AI Tools Usage</span>
                        <span>{formatScore(team.averageScores.aiToolsAverage)}/3</span>
                      </div>
                      <Progress value={(team.averageScores.aiToolsAverage / 3) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Solution Clarity</span>
                        <span>{getEvaluationLabel(team.averageScores.solutionDescription)}</span>
                      </div>
                      <Progress value={(team.averageScores.solutionDescription / 3) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>EX Roles</span>
                        <span>{getEvaluationLabel(team.averageScores.exRolesContribution)}</span>
                      </div>
                      <Progress value={(team.averageScores.exRolesContribution / 3) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Learning Impact</span>
                        <span>{formatScore(team.learnedNewTechniquePercentage, 0)}%</span>
                      </div>
                      <Progress value={team.learnedNewTechniquePercentage} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {teamSummaries.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No evaluations submitted yet. Submit some evaluations to see results!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-4">
          {teamSummaries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No evaluations submitted yet. Submit some evaluations to see AI tools analysis!</p>
              </CardContent>
            </Card>
          ) : (
            teamSummaries.map((team, index) => (
              <Card key={team.teamName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(index + 1)}
                      <div>
                        <CardTitle>{team.teamName}</CardTitle>
                        <CardDescription>
                          AI Tools Usage Breakdown
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">
                      AI Avg: {formatScore(team.averageScores.aiToolsAverage)}/3
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AI_TOOLS_CATEGORIES.map((category) => (
                      <div key={category.key} className="space-y-2 p-3 border rounded">
                        <div className="flex justify-between items-start">
                          <span className="text-sm">{category.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {formatScore(team.averageScores.aiToolsScores[category.key])}/3
                          </Badge>
                        </div>
                        <Progress 
                          value={(team.averageScores.aiToolsScores[category.key] / 3) * 100} 
                          className="h-1" 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="solution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solution Clarity Rankings</CardTitle>
              <CardDescription>
                Teams ranked by how clearly they described their solution and AI contribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamSummaries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No evaluations submitted yet. Submit some evaluations to see solution clarity rankings!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamSummaries
                    .slice()
                    .sort((a, b) => b.averageScores.solutionDescription - a.averageScores.solutionDescription)
                    .map((team, index) => (
                      <div key={team.teamName} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getRankIcon(index + 1)}
                          <div>
                            <h4>{team.teamName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Average solution clarity: {getEvaluationLabel(team.averageScores.solutionDescription)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl">{getEvaluationLabel(team.averageScores.solutionDescription)}</p>
                          <p className="text-sm text-muted-foreground">{formatScore(team.averageScores.solutionDescription)}/3</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ex-roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>EX Roles Contribution Rankings</CardTitle>
              <CardDescription>
                Teams ranked by how well they demonstrate EX roles contributing to better outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamSummaries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No evaluations submitted yet. Submit some evaluations to see EX roles rankings!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamSummaries
                    .slice()
                    .sort((a, b) => b.averageScores.exRolesContribution - a.averageScores.exRolesContribution)
                    .map((team, index) => (
                      <div key={team.teamName} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getRankIcon(index + 1)}
                          <div>
                            <h4>{team.teamName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Average EX roles contribution: {getEvaluationLabel(team.averageScores.exRolesContribution)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl">{getEvaluationLabel(team.averageScores.exRolesContribution)}</p>
                          <p className="text-sm text-muted-foreground">{formatScore(team.averageScores.exRolesContribution)}/3</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Impact Rankings</CardTitle>
              <CardDescription>
                Teams ranked by how much judges learned from their presentations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamSummaries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No evaluations submitted yet. Submit some evaluations to see learning impact rankings!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamSummaries
                    .slice()
                    .sort((a, b) => b.learnedNewTechniquePercentage - a.learnedNewTechniquePercentage)
                    .map((team, index) => (
                      <div key={team.teamName} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getRankIcon(index + 1)}
                          <div>
                            <h4>{team.teamName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {team.learnedNewTechniqueCount} out of {team.evaluationCount} judges learned something new
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl">{formatScore(team.learnedNewTechniquePercentage, 0)}%</p>
                          <p className="text-sm text-muted-foreground">Learning Rate</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Evaluations</CardTitle>
              <CardDescription>Complete list of all submitted evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              {allEvaluations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No evaluations submitted yet. Submit some evaluations to see them here!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Judge</TableHead>
                        <TableHead>AI Tools</TableHead>
                        <TableHead>Solution</TableHead>
                        <TableHead>EX Roles</TableHead>
                        <TableHead>Learned</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allEvaluations
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((evaluation) => (
                          <TableRow key={evaluation.id}>
                            <TableCell>
                              {new Date(evaluation.timestamp).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{evaluation.teamName}</TableCell>
                            <TableCell>{evaluation.judgeName}</TableCell>
                            <TableCell>{formatScore(evaluation.aiToolsAverage)}/3</TableCell>
                            <TableCell>{getEvaluationLabel(evaluation.scores.solutionDescription)}</TableCell>
                            <TableCell>{getEvaluationLabel(evaluation.scores.exRolesContribution)}</TableCell>
                            <TableCell>
                              <Badge variant={evaluation.scores.learnedNewTechnique ? "default" : "secondary"}>
                                {evaluation.scores.learnedNewTechnique ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatScore(evaluation.totalScore)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}