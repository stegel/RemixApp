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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Plus, Trash2, Users, FileText, AlertTriangle, RefreshCw, Shield, Edit, Upload, Download } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api, Evaluation, EVALUATION_SCALE_VALUES } from "../utils/api";
import { getTeamDisplayName } from "../utils/teamUtils";
import { DatabaseMigrationNotice } from "./DatabaseMigrationNotice";

interface Team {
  id: string;
  team_number: number;
  team_name?: string;
  created_at: string;
}

export function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [newTeamNumber, setNewTeamNumber] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamNumber, setEditTeamNumber] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamEvaluationCounts, setTeamEvaluationCounts] = useState<Record<string, number>>({});
  const [isLegacyMode, setIsLegacyMode] = useState(false);
  const [showMigrationNotice, setShowMigrationNotice] = useState(true);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ teamNumber: number; teamName?: string }[]>([]);

  const fetchTeams = async () => {
    try {
      const result = await api.getTeams();
      setTeams(result.teams);
      
      // Check if we're in legacy mode by testing for the new schema columns
      try {
        const { supabase } = await import('../utils/supabase/client');
        const { error } = await supabase
          .from('teams')
          .select('team_number, team_name')
          .limit(1);
        
        // If error code is 42703, it means the columns don't exist (legacy mode)
        setIsLegacyMode(error?.code === '42703');
      } catch (schemaError) {
        // If there's an error testing the schema, assume we're not in legacy mode
        console.log('Schema test error:', schemaError);
        setIsLegacyMode(false);
      }
      
      // Get evaluation counts for each team
      const counts: Record<string, number> = {};
      for (const team of result.teams) {
        const teamDisplayName = getTeamDisplayName(team.team_number, team.team_name);
        const count = await api.getEvaluationCountByTeam(teamDisplayName);
        counts[teamDisplayName] = count;
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
    
    const teamNumber = parseInt(newTeamNumber.trim());
    if (!newTeamNumber.trim() || isNaN(teamNumber) || teamNumber <= 0) {
      toast.error("Please enter a valid team number");
      return;
    }

    // Check if team number already exists
    if (teams.some(team => team.team_number === teamNumber)) {
      toast.error("A team with this number already exists");
      return;
    }

    // Check if team name already exists (if provided)
    if (newTeamName.trim() && teams.some(team => 
      team.team_name && team.team_name.toLowerCase() === newTeamName.trim().toLowerCase()
    )) {
      toast.error("A team with this name already exists");
      return;
    }

    try {
      await api.addTeam(teamNumber, newTeamName.trim() || undefined);
      setNewTeamNumber("");
      setNewTeamName("");
      await fetchTeams();
      toast.success("Team added successfully");
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error("Failed to add team");
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditTeamNumber(team.team_number.toString());
    setEditTeamName(team.team_name || "");
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;
    
    const teamNumber = parseInt(editTeamNumber.trim());
    if (!editTeamNumber.trim() || isNaN(teamNumber) || teamNumber <= 0) {
      toast.error("Please enter a valid team number");
      return;
    }

    // Check if team number already exists (excluding current team)
    if (teams.some(team => team.id !== editingTeam.id && team.team_number === teamNumber)) {
      toast.error("A team with this number already exists");
      return;
    }

    // Check if team name already exists (excluding current team, if provided)
    if (editTeamName.trim() && teams.some(team => 
      team.id !== editingTeam.id && 
      team.team_name && 
      team.team_name.toLowerCase() === editTeamName.trim().toLowerCase()
    )) {
      toast.error("A team with this name already exists");
      return;
    }

    try {
      await api.updateTeam(editingTeam.id, teamNumber, editTeamName.trim() || undefined);
      setEditingTeam(null);
      setEditTeamNumber("");
      setEditTeamName("");
      await fetchTeams();
      toast.success("Team updated successfully");
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error("Failed to update team");
    }
  };

  const handleDeleteTeam = async (teamId: string, teamNumber: number, teamName?: string) => {
    const teamDisplay = getTeamDisplayName(teamNumber, teamName);
    try {
      const evaluationCount = teamEvaluationCounts[teamDisplay] || 0;
      
      if (evaluationCount > 0) {
        toast.error(`Cannot delete ${teamDisplay} because it has ${evaluationCount} evaluation(s). Delete the evaluations first.`);
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

  const parseCsvFile = (file: File): Promise<{ teamNumber: number; teamName?: string }[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').map(line => line.trim()).filter(line => line);
          
          if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          const teams: { teamNumber: number; teamName?: string }[] = [];
          let startIndex = 0;

          // Check if first line is a header
          const firstLine = lines[0].toLowerCase();
          if (firstLine.includes('team_number') || firstLine.includes('number') || firstLine.includes('name')) {
            startIndex = 1;
          }

          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
            
            if (columns.length === 0 || !columns[0]) continue;

            const teamNumber = parseInt(columns[0]);
            if (isNaN(teamNumber) || teamNumber <= 0) {
              reject(new Error(`Invalid team number "${columns[0]}" on line ${i + 1}`));
              return;
            }

            const teamName = columns[1] && columns[1].trim() ? columns[1].trim() : undefined;

            teams.push({ teamNumber, teamName });
          }

          if (teams.length === 0) {
            reject(new Error('No valid team data found in CSV'));
            return;
          }

          // Check for duplicate team numbers in CSV
          const teamNumbers = teams.map(t => t.teamNumber);
          const duplicates = teamNumbers.filter((num, index) => teamNumbers.indexOf(num) !== index);
          if (duplicates.length > 0) {
            reject(new Error(`Duplicate team numbers found in CSV: ${duplicates.join(', ')}`));
            return;
          }

          resolve(teams);
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      setCsvPreview([]);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      setCsvFile(file);
      const teams = await parseCsvFile(file);
      setCsvPreview(teams);
      toast.success(`Parsed ${teams.length} teams from CSV`);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error(error.message);
      setCsvFile(null);
      setCsvPreview([]);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile || csvPreview.length === 0) {
      toast.error('No CSV data to import');
      return;
    }

    setCsvImporting(true);
    try {
      let successCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const team of csvPreview) {
        try {
          // Check if team number already exists
          if (teams.some(existingTeam => existingTeam.team_number === team.teamNumber)) {
            skippedCount++;
            console.log(`Skipped team ${team.teamNumber} (already exists)`);
            continue;
          }

          // Check if team name already exists (if provided)
          if (team.teamName && teams.some(existingTeam => 
            existingTeam.team_name && 
            existingTeam.team_name.toLowerCase() === team.teamName.toLowerCase()
          )) {
            skippedCount++;
            console.log(`Skipped team ${team.teamNumber} (name "${team.teamName}" already exists)`);
            continue;
          }

          await api.addTeam(team.teamNumber, team.teamName);
          successCount++;
        } catch (error) {
          console.error(`Error adding team ${team.teamNumber}:`, error);
          errors.push(`Team ${team.teamNumber}: ${error.message}`);
        }
      }

      // Reset form
      setCsvFile(null);
      setCsvPreview([]);
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh teams list
      await fetchTeams();

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} team(s)`);
      }
      
      if (skippedCount > 0) {
        toast.warning(`Skipped ${skippedCount} team(s) (already exist)`);
      }

      if (errors.length > 0) {
        toast.error(`Failed to import ${errors.length} team(s). Check console for details.`);
        console.error('Import errors:', errors);
      }

    } catch (error) {
      console.error('Error during CSV import:', error);
      toast.error('Failed to import teams from CSV');
    } finally {
      setCsvImporting(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = "team_number,team_name\n1,Team Alpha\n2,Team Beta\n3,\n4,Team Delta";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teams_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

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
      {/* Migration Notice */}
      {isLegacyMode && showMigrationNotice && (
        <DatabaseMigrationNotice onDismiss={() => setShowMigrationNotice(false)} />
      )}

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
                Create a new team with a number (required) and optional name that judges can evaluate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTeam} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="team-number">Team Number *</Label>
                    <Input
                      id="team-number"
                      type="number"
                      min="1"
                      value={newTeamNumber}
                      onChange={(e) => setNewTeamNumber(e.target.value)}
                      placeholder="Enter team number"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="team-name">Team Name (Optional)</Label>
                    <Input
                      id="team-name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter team name"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
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
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Import Teams from CSV
              </CardTitle>
              <CardDescription>
                Upload a CSV file with team numbers and optional team names. Format: team_number,team_name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={downloadCsvTemplate}
                    className="flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Download a sample CSV format to get started
                  </span>
                </div>
                
                <div>
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    CSV format: team_number,team_name (team_name is optional)
                  </p>
                </div>

                {csvPreview.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview ({csvPreview.length} teams)</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 bg-muted/30">
                      {csvPreview.slice(0, 10).map((team, index) => (
                        <div key={index} className="text-sm flex justify-between py-1">
                          <span>Team {team.teamNumber}</span>
                          <span className="text-muted-foreground">
                            {team.teamName || '(no name)'}
                          </span>
                        </div>
                      ))}
                      {csvPreview.length > 10 && (
                        <div className="text-sm text-muted-foreground pt-1 border-t">
                          ... and {csvPreview.length - 10} more teams
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={handleCsvImport}
                    disabled={csvPreview.length === 0 || csvImporting}
                  >
                    {csvImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Teams
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Teams ({teams.length})</CardTitle>
              <CardDescription>
                Manage teams with numbers and names, view evaluation counts
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
                  {teams.map((team) => {
                    const teamDisplay = getTeamDisplayName(team.team_number, team.team_name);
                    const evaluationCount = teamEvaluationCounts[teamDisplay] || 0;
                    
                    return (
                      <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4>{teamDisplay}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>#{team.team_number}</span>
                              {team.team_name && <span>• {team.team_name}</span>}
                              <span>• Created {new Date(team.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {evaluationCount} evaluation(s)
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleEditTeam(team)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Team</DialogTitle>
                                <DialogDescription>
                                  Update the team number and name. The team number is required.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-team-number">Team Number *</Label>
                                  <Input
                                    id="edit-team-number"
                                    type="number"
                                    min="1"
                                    value={editTeamNumber}
                                    onChange={(e) => setEditTeamNumber(e.target.value)}
                                    placeholder="Enter team number"
                                    className="mt-1"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-team-name">Team Name (Optional)</Label>
                                  <Input
                                    id="edit-team-name"
                                    value={editTeamName}
                                    onChange={(e) => setEditTeamName(e.target.value)}
                                    placeholder="Enter team name"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingTeam(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateTeam}>
                                  Update Team
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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
                                  Are you sure you want to delete {teamDisplay}? 
                                  {evaluationCount > 0 && (
                                    <span className="block mt-2 text-destructive">
                                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                                      This team has {evaluationCount} evaluation(s). 
                                      Delete those evaluations first.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTeam(team.id, team.team_number, team.team_name)}
                                  disabled={evaluationCount > 0}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Team
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
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