import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Plus, Trash2, Users, FileText, AlertTriangle, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api, Evaluation, EVALUATION_SCALE_VALUES } from "../utils/api";

interface Team {
  id: string;
  name: string;
  created_at: string;
}

export function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamEvaluationCounts, setTeamEvaluationCounts] = useState<Record<string, number>>({});

  const fetchTeams = async () => {
    try {
      const result = await api.getTeams();
      setTeams(result.teams);
      
      // Get evaluation counts for each team
      const counts: Record<string, number> = {};
      for (const team of result.teams) {
        const count = await api.getEvaluationCountByTeam(team.name);
        counts[team.name] = count;
      }
      setTeamEvaluationCounts(counts);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    }
  };

  const fetchEvaluations = async () => {
    try {
      const result = await api.getEvaluations();
      setEvaluations(result.evaluations);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast.error('Failed to load evaluations');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTeams(), fetchEvaluations()]);
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
    toast.success("Data refreshed successfully");
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    // Check if team name already exists
    if (teams.some(team => team.name.toLowerCase() === newTeamName.trim().toLowerCase())) {
      toast.error("A team with this name already exists");
      return;
    }

    try {
      await api.addTeam(newTeamName);
      setNewTeamName("");
      await fetchTeams();
      toast.success("Team added successfully");
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error("Failed to add team");
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    try {
      const evaluationCount = teamEvaluationCounts[teamName] || 0;
      
      if (evaluationCount > 0) {
        toast.error(`Cannot delete team "${teamName}" because it has ${evaluationCount} evaluation(s). Delete the evaluations first.`);
        return;
      }

      await api.deleteTeam(teamId);
      await fetchTeams();
      toast.success("Team deleted successfully");
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error("Failed to delete team");
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string, teamName: string, judgeName: string) => {
    try {
      await api.deleteEvaluation(evaluationId);
      await Promise.all([fetchEvaluations(), fetchTeams()]); // Refresh both to update counts
      toast.success(`Evaluation by ${judgeName} for ${teamName} deleted successfully`);
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast.error("Failed to delete evaluation");
    }
  };

  const getEvaluationLabel = (value: number) => {
    const labelMap = {
      [EVALUATION_SCALE_VALUES.basic]: 'Basic',
      [EVALUATION_SCALE_VALUES.thoughtful]: 'Thoughtful',
      [EVALUATION_SCALE_VALUES.extraordinary]: 'Extraordinary'
    };
    return labelMap[Math.round(value)] || 'Basic';
  };

  const formatScore = (score: number, decimals: number = 1) => score.toFixed(decimals);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2>Administration</h2>
            <Badge variant="secondary">Authenticated</Badge>
          </div>
          <p className="text-muted-foreground">
            Manage teams and evaluations
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teams">Team Management</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluation Management</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Add New Team
              </CardTitle>
              <CardDescription>
                Create a new team that judges can evaluate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTeam} className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Team
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Teams ({teams.length})</CardTitle>
              <CardDescription>
                Manage teams and view evaluation counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No teams found. Add a team to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4>{team.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(team.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {teamEvaluationCounts[team.name] || 0} evaluation(s)
                        </Badge>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Team</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete team "{team.name}"? 
                              {teamEvaluationCounts[team.name] > 0 && (
                                <span className="block mt-2 text-destructive">
                                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                                  This team has {teamEvaluationCounts[team.name]} evaluation(s). 
                                  Delete those evaluations first.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTeam(team.id, team.name)}
                              disabled={teamEvaluationCounts[team.name] > 0}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Team
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                All Evaluations ({evaluations.length})
              </CardTitle>
              <CardDescription>
                View and delete individual evaluation submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No evaluations found.</p>
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
                        <TableHead>Total Score</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluations
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((evaluation) => (
                          <TableRow key={evaluation.id}>
                            <TableCell>
                              {new Date(evaluation.timestamp).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{evaluation.teamName}</Badge>
                            </TableCell>
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
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Evaluation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the evaluation by {evaluation.judgeName} for team {evaluation.teamName}? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteEvaluation(evaluation.id, evaluation.teamName, evaluation.judgeName)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete Evaluation
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
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