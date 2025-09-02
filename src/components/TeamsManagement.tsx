import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { fetchTeams, createTeam, updateTeam, deleteTeam, importTeamsFromCSV, Team, TeamInput, CSVTeamInput, LOCATION_OPTIONS, LocationOption, getTeamDisplayName } from '../utils/api';
import { typographyStyles } from '../utils/ui-helpers';
import { Plus, Edit, Trash2, Upload, Download } from 'lucide-react';

export function TeamsManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<TeamInput>({
    teamNumber: undefined,
    name: '',
    location: undefined,
    isActive: true
  });
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[]; total: number } | null>(null);
  const [importing, setImporting] = useState(false);

  const loadTeams = async () => {
    try {
      setError(null);
      const data = await fetchTeams();
      setTeams(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch teams';
      if (errorMessage.includes('Could not find the table')) {
        setError('Database tables not found. Please run the database schema SQL script in your Supabase SQL Editor first.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if we have either a team number or a team name
    if (!formData.teamNumber && !formData.name?.trim()) {
      setError('Either team number or team name is required');
      return;
    }

    // If team number is provided, validate it
    if (formData.teamNumber && formData.teamNumber <= 0) {
      setError('Team number must be a positive integer');
      return;
    }

    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, formData);
      } else {
        await createTeam(formData);
      }
      
      await loadTeams();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team');
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      teamNumber: team.team_number,
      name: team.name || '',
      location: team.location,
      isActive: team.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTeam(team.id);
      await loadTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTeam(null);
    setFormData({
      teamNumber: undefined,
      name: '',
      location: undefined,
      isActive: true
    });
    setError(null);
  };

  const parseCSV = (csvText: string): CSVTeamInput[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Skip header if it exists (check if first line contains expected headers)
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('team') && firstLine.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line, index) => {
      const values = line.split(',').map(val => val.trim().replace(/^"|"$/g, ''));
      const rowNumber = hasHeader ? index + 2 : index + 1;

      if (values.length < 2) {
        throw new Error(`Row ${rowNumber}: Invalid format. Expected at least Team Number and Team Name`);
      }

      const teamNumber = values[0] ? parseInt(values[0]) : undefined;
      const name = values[1] || '';
      const location = values[2] || '';

      // Check if we have either team number or name
      if (!teamNumber && !name.trim()) {
        throw new Error(`Row ${rowNumber}: Either team number or team name is required`);
      }

      // If team number is provided, validate it
      if (values[0] && (isNaN(teamNumber!) || teamNumber! <= 0)) {
        throw new Error(`Row ${rowNumber}: Team number must be a positive integer`);
      }

      // Validate location if provided
      const trimmedLocation = location.trim();
      if (trimmedLocation && !LOCATION_OPTIONS.includes(trimmedLocation as LocationOption)) {
        throw new Error(`Row ${rowNumber}: Invalid location "${trimmedLocation}". Must be one of: ${LOCATION_OPTIONS.join(', ')}`);
      }

      return {
        teamNumber,
        name: name.trim() || undefined,
        location: trimmedLocation ? (trimmedLocation as LocationOption) : undefined
      };
    });
  };

  const handleCSVImport = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setImporting(true);
    setError(null);
    setImportResults(null);

    try {
      const csvText = await csvFile.text();
      const teams = parseCSV(csvText);
      
      const results = await importTeamsFromCSV(teams);
      setImportResults(results);
      
      if (results.success > 0) {
        await loadTeams();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'Team Number,Team Name,Location',
      '1,Engineering Team,Americas',
      '2,Design Team,Amsterdam',
      '3,Product Team,Hyderabad'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-teams.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card style={{ borderRadius: 'var(--radius-card)' }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle style={typographyStyles.h2}>
                Teams Management
              </CardTitle>
              <CardDescription style={typographyStyles.muted}>
                Manage teams participating in the AI experience simulation
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {/* CSV Import Button */}
              <Dialog open={csvImportOpen} onOpenChange={setCsvImportOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    style={{ borderRadius: 'var(--radius-button)' }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent style={{ borderRadius: 'var(--radius)' }}>
                  <DialogHeader>
                    <DialogTitle style={typographyStyles.h2}>
                      Import Teams from CSV
                    </DialogTitle>
                    <DialogDescription style={typographyStyles.muted}>
                      Upload a CSV file to bulk import teams. Format: Team Number, Team Name, Location
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-md border border-destructive bg-destructive/10 text-destructive text-sm" style={{ borderRadius: 'var(--radius)' }}>
                        {error}
                      </div>
                    )}
                    
                    {importResults && (
                      <div className="p-3 rounded-md border border-accent bg-accent/10 text-accent-foreground text-sm" style={{ borderRadius: 'var(--radius)' }}>
                        <p className="font-semibold">Import Results:</p>
                        <p>Successfully imported {importResults.success} out of {importResults.total} teams</p>
                        {importResults.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="font-semibold">Errors:</p>
                            <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                              {importResults.errors.map((error, index) => (
                                <li key={index} className="text-xs">{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="csvFile" style={typographyStyles.label}>
                        Select CSV File
                      </Label>
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        className="border-border"
                        style={{ borderRadius: 'var(--radius)' }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Expected format: Team Number, Team Name, Location (either team number or name required) - header row optional
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadSampleCSV}
                        style={{ borderRadius: 'var(--radius-button)' }}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download Sample
                      </Button>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCsvImportOpen(false);
                        setCsvFile(null);
                        setImportResults(null);
                        setError(null);
                      }}
                      style={{ borderRadius: 'var(--radius-button)' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCSVImport}
                      disabled={!csvFile || importing}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      style={{ borderRadius: 'var(--radius-button)' }}
                    >
                      {importing ? 'Importing...' : 'Import Teams'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Add Team Button */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setDialogOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    style={{ borderRadius: 'var(--radius-button)' }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Team
                  </Button>
                </DialogTrigger>
                <DialogContent style={{ borderRadius: 'var(--radius)' }}>
                  <DialogHeader>
                    <DialogTitle style={typographyStyles.h2}>
                      {editingTeam ? 'Edit Team' : 'Add New Team'}
                    </DialogTitle>
                    <DialogDescription style={typographyStyles.muted}>
                      {editingTeam ? 'Update team information' : 'Create a new team for the simulation'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-md border border-destructive bg-destructive/10 text-destructive text-sm" style={{ borderRadius: 'var(--radius)' }}>
                        {error}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="teamNumber" style={typographyStyles.label}>
                        Team Number
                      </Label>
                      <Input
                        id="teamNumber"
                        type="number"
                        value={formData.teamNumber || ''}
                        onChange={(e) => setFormData({ ...formData, teamNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="Optional team number"
                        className="border-border"
                        style={{ borderRadius: 'var(--radius)' }}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teamName" style={typographyStyles.label}>
                        Team Name
                      </Label>
                      <Input
                        id="teamName"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Team name"
                        className="border-border"
                        style={{ borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location" style={typographyStyles.label}>
                        Location
                      </Label>
                      <Select
                        value={formData.location || ''}
                        onValueChange={(value: LocationOption) => setFormData({ ...formData, location: value })}
                      >
                        <SelectTrigger
                          className="border-border"
                          style={{ borderRadius: 'var(--radius)' }}
                        >
                          <SelectValue placeholder="Select team location (optional)" />
                        </SelectTrigger>
                        <SelectContent style={{ borderRadius: 'var(--radius)' }}>
                          {LOCATION_OPTIONS.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive" style={typographyStyles.label}>
                        Active (visible in judging form)
                      </Label>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        style={{ borderRadius: 'var(--radius-button)' }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        style={{ borderRadius: 'var(--radius-button)' }}
                      >
                        {editingTeam ? 'Update Team' : 'Create Team'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-6 p-4 rounded-md border border-destructive bg-destructive/10" style={{ borderRadius: 'var(--radius)' }}>
              <p className="text-destructive text-sm">{error}</p>
              {error.includes('Database tables not found') && (
                <div className="mt-3 p-3 bg-muted rounded" style={{ borderRadius: 'var(--radius)' }}>
                  <p className="text-sm font-semibold mb-2">To fix this error:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside" style={typographyStyles.muted}>
                    <li>Go to your Supabase Dashboard</li>
                    <li>Navigate to the SQL Editor</li>
                    <li>Copy and paste the contents of <code>/database-schema.sql</code></li>
                    <li>Run the SQL script to create the required tables</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}
            </div>
          )}
          
          {loading ? (
            <p style={typographyStyles.muted}>Loading teams...</p>
          ) : error && error.includes('Database tables not found') ? (
            <div className="text-center py-8">
              <p style={typographyStyles.muted}>Please set up the database tables first using the instructions above.</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8">
              <p style={typographyStyles.muted}>No teams found. Create your first team to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <span style={typographyStyles.muted}>
                        {team.team_number || '-'}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                      {getTeamDisplayName(team)}
                    </TableCell>
                    <TableCell>
                      <span style={typographyStyles.muted}>
                        {team.location || 'Not specified'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={team.is_active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}
                        style={{ borderRadius: 'var(--radius-badge)' }}
                      >
                        {team.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(team)}
                          style={{ borderRadius: 'var(--radius-button)' }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(team)}
                          style={{ borderRadius: 'var(--radius-button)' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}