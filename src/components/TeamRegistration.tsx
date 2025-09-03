import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchTeams, createTeam, updateTeam, Team } from '../utils/api';
import { typographyStyles } from '../utils/ui-helpers';

interface FormData {
  teamNumber: string;
  teamName: string;
}

export function TeamRegistration() {
  const [formData, setFormData] = useState<FormData>({
    teamNumber: '',
    teamName: ''
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [existingTeam, setExistingTeam] = useState<Team | null>(null);

  // Load teams on component mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setTeamsLoading(true);
        const teamsData = await fetchTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error('Failed to load teams:', error);
        setSubmitStatus('error');
        setStatusMessage('Failed to load team data. Please refresh the page.');
      } finally {
        setTeamsLoading(false);
      }
    };

    loadTeams();
  }, []);

  // Get available team numbers from teams with null names
  const getAvailableTeamNumbers = () => {
    return teams
      .filter(team => team.name === null || team.name === undefined || team.name === '')
      .map(team => team.team_number?.toString())
      .filter(num => num !== undefined)
      .sort((a, b) => parseInt(a) - parseInt(b));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear status when user makes changes
    if (submitStatus) {
      setSubmitStatus(null);
      setStatusMessage('');
    }
  };

  const checkForExistingTeam = (teamName: string) => {
    return teams.find(team => 
      team.name?.toLowerCase().trim() === teamName.toLowerCase().trim()
    );
  };

  const validateForm = () => {
    if (!formData.teamNumber || !formData.teamName.trim()) {
      setSubmitStatus('error');
      setStatusMessage('Please fill in both team number and team name.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const trimmedName = formData.teamName.trim();
    const existingTeamWithName = checkForExistingTeam(trimmedName);

    // Check if there's an existing team with the same name
    if (existingTeamWithName) {
      setExistingTeam(existingTeamWithName);
      setShowOverwriteDialog(true);
      return;
    }

    await submitTeam();
  };

  const submitTeam = async (overwrite = false) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    setStatusMessage('');

    try {
      const teamNumber = parseInt(formData.teamNumber);
      const trimmedName = formData.teamName.trim();

      if (overwrite && existingTeam) {
        // Update existing team
        await updateTeam(existingTeam.id, {
          teamNumber: teamNumber,
          name: trimmedName,
          location: existingTeam.location,
          isActive: true
        });
        setStatusMessage(`Team "${trimmedName}" updated successfully with team number ${teamNumber}!`);
      } else {
        // Create new team
        await createTeam({
          teamNumber: teamNumber,
          name: trimmedName,
          location: null,
          isActive: true
        });
        setStatusMessage(`Team "${trimmedName}" registered successfully with team number ${teamNumber}!`);
      }

      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        teamNumber: '',
        teamName: ''
      });

      // Reload teams to get updated data
      const teamsData = await fetchTeams();
      setTeams(teamsData);

    } catch (error: any) {
      console.error('Failed to submit team:', error);
      setSubmitStatus('error');
      
      if (error.message?.includes('Team number already exists')) {
        setStatusMessage('This team number is already taken. Please choose a different number.');
      } else if (error.message?.includes('Team name already exists')) {
        setStatusMessage('This team name is already taken. Please choose a different name.');
      } else {
        setStatusMessage('Failed to register team. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setShowOverwriteDialog(false);
      setExistingTeam(null);
    }
  };

  const handleOverwriteConfirm = () => {
    submitTeam(true);
  };

  const availableTeamNumbers = getAvailableTeamNumbers();

  return (
    <div className="max-w-2xl mx-auto">
      <Card style={{ borderRadius: 'var(--radius-card)' }}>
        <CardHeader>
          <CardTitle style={typographyStyles.h2}>
            Team Registration
          </CardTitle>
          <CardDescription style={typographyStyles.muted}>
            Assign a team name to an available team number. Only team numbers that need names are shown.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Messages */}
          {submitStatus && (
            <Alert className={submitStatus === 'success' ? 'border-accent' : 'border-destructive'}>
              {submitStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-accent" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertDescription style={{
                ...typographyStyles.body,
                color: submitStatus === 'success' ? 'var(--accent)' : 'var(--destructive)'
              }}>
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Number Selection */}
            <div className="space-y-2">
              <Label 
                htmlFor="teamNumber"
                style={{ 
                  ...typographyStyles.label,
                  color: 'var(--foreground)'
                }}
              >
                Team Number *
              </Label>
              <Select 
                value={formData.teamNumber} 
                onValueChange={(value) => handleInputChange('teamNumber', value)}
                disabled={teamsLoading || availableTeamNumbers.length === 0}
              >
                <SelectTrigger 
                  className="bg-input-background border-border"
                  style={{ 
                    borderRadius: 'var(--radius)',
                    ...typographyStyles.body
                  }}
                >
                  <SelectValue placeholder={
                    teamsLoading ? "Loading numbers..." : 
                    availableTeamNumbers.length === 0 ? "No numbers need names" : 
                    "Select a team number"
                  } />
                </SelectTrigger>
                <SelectContent style={{ borderRadius: 'var(--radius)' }}>
                  {availableTeamNumbers.length === 0 ? (
                    <SelectItem value="__no_numbers__" disabled style={typographyStyles.muted}>
                      No team numbers need names
                    </SelectItem>
                  ) : (
                    availableTeamNumbers.map((number) => (
                      <SelectItem 
                        key={number} 
                        value={number}
                        style={typographyStyles.body}
                      >
                        Team {number}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p style={{ 
                ...typographyStyles.muted, 
                fontSize: 'var(--text-label)',
                marginTop: '4px'
              }}>
                Choose from team numbers that need names assigned
              </p>
            </div>

            {/* Team Name Input */}
            <div className="space-y-2">
              <Label 
                htmlFor="teamName"
                style={{ 
                  ...typographyStyles.label,
                  color: 'var(--foreground)'
                }}
              >
                Team Name *
              </Label>
              <Input
                id="teamName"
                type="text"
                value={formData.teamName}
                onChange={(e) => handleInputChange('teamName', e.target.value)}
                placeholder="Enter your team name"
                className="bg-input-background border-border"
                style={{ 
                  borderRadius: 'var(--radius)',
                  ...typographyStyles.body
                }}
                maxLength={100}
              />
              <p style={{ 
                ...typographyStyles.muted, 
                fontSize: 'var(--text-label)',
                marginTop: '4px'
              }}>
                Choose a unique name for your team
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !formData.teamNumber || !formData.teamName.trim()}
              className="w-full"
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering Team...
                </>
              ) : (
                'Register Team'
              )}
            </Button>
          </form>

          {/* Team Status Info */}
          {!teamsLoading && (
            <div className="mt-6 p-4 bg-muted/20 rounded" style={{ borderRadius: 'var(--radius)' }}>
              <p style={{ 
                ...typographyStyles.muted, 
                fontSize: 'var(--text-label)',
                marginBottom: '8px'
              }}>
                Team Status:
              </p>
              <div className="flex justify-between">
                <span style={typographyStyles.muted}>Total Teams:</span>
                <span style={typographyStyles.body}>{teams.length}</span>
              </div>
              <div className="flex justify-between">
                <span style={typographyStyles.muted}>Teams With Names:</span>
                <span style={typographyStyles.body}>{teams.filter(team => team.name && team.name.trim() !== '').length}</span>
              </div>
              <div className="flex justify-between">
                <span style={typographyStyles.muted}>Teams Needing Names:</span>
                <span style={typographyStyles.body}>{availableTeamNumbers.length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overwrite Confirmation Dialog */}
      <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <AlertDialogContent style={{ borderRadius: 'var(--radius)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={typographyStyles.h3}>
              Team Name Already Exists
            </AlertDialogTitle>
            <AlertDialogDescription style={typographyStyles.muted}>
              A team with the name "{formData.teamName}" already exists
              {existingTeam?.team_number ? ` with team number ${existingTeam.team_number}` : ''}.
              Do you want to update this team with the new team number ({formData.teamNumber})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowOverwriteDialog(false)}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleOverwriteConfirm}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Update Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}