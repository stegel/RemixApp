import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { questions, scaleOptions } from './constants';
import { submitEvaluation, FormData, fetchTeams, Team, getTeamDisplayName } from '../utils/api';
import { typographyStyles } from '../utils/ui-helpers';
import { Check, ChevronsUpDown } from 'lucide-react';

export function JudgingForm() {
  const [formData, setFormData] = useState<FormData>({
    participantName: '',
    teamId: 0, // Initialize as 0 to indicate no selection
    question1: '',
    question2: '',
    question3: '',
    question4: '',
    question5: ''
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

  const loadTeams = async () => {
    try {
      const data = await fetchTeams(true); // Only load active teams
      setTeams(data);
    } catch (err) {
      console.error('Failed to load teams:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teams';
      if (errorMessage.includes('Could not find the table')) {
        setError('Database not set up yet. Please contact your administrator to run the database setup.');
      } else {
        setError('Failed to load teams. Please refresh the page.');
      }
    } finally {
      setTeamsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleValueChange = (questionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Check all required fields including teamId
    const requiredFieldsFilled = formData.participantName.trim() && 
      formData.teamId > 0 && 
      formData.question1 && 
      formData.question2 && 
      formData.question3 && 
      formData.question4 && 
      formData.question5;
    
    if (!requiredFieldsFilled) {
      setError('Please fill in all fields before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await submitEvaluation(formData);
      console.log('Evaluation submitted successfully:', result);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while submitting your evaluation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      participantName: '',
      teamId: 0,
      question1: '',
      question2: '',
      question3: '',
      question4: '',
      question5: ''
    });
    setSubmitted(false);
    setError(null);
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-4xl mx-auto" style={{ borderRadius: 'var(--radius-card)' }}>
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <h2 style={{ 
              ...typographyStyles.h1,
              color: 'var(--primary)'
            }}>
              Thank You!
            </h2>
            <p style={{ 
              ...typographyStyles.muted,
              marginTop: '16px'
            }}>
              Your feedback has been submitted successfully. We appreciate your participation in evaluating the AI experience simulation.
            </p>
          </div>
          <Button 
            onClick={handleReset}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            style={{ borderRadius: 'var(--radius-button)' }}
          >
            Submit Another Response
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto" style={{ borderRadius: 'var(--radius-card)' }}>
      <CardHeader className="pb-6">
        <CardTitle style={typographyStyles.h2}>
          Experience Evaluation
        </CardTitle>
        <CardDescription style={typographyStyles.muted}>
          Please rate the team's presentation on a scale from Strongly Disagree (0) to Strongly Agree (4).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Participant Information Section */}
          <div className="space-y-6 pb-6 border-b border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label 
                  htmlFor="participantName"
                  style={{ 
                    ...typographyStyles.label,
                    color: 'var(--foreground)'
                  }}
                >
                  Your Name
                </Label>
                <Input
                  id="participantName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.participantName}
                  onChange={(e) => handleInputChange('participantName', e.target.value)}
                  className="bg-input-background border-border"
                  style={{ 
                    borderRadius: 'var(--radius)',
                    ...typographyStyles.body
                  }}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label 
                  htmlFor="teamName"
                  style={{ 
                    ...typographyStyles.label,
                    color: 'var(--foreground)'
                  }}
                >
                  Who are you evaluating?
                </Label>
                <Popover open={teamDropdownOpen} onOpenChange={setTeamDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={teamDropdownOpen}
                      className="w-full justify-between bg-input-background border-border hover:bg-input-background"
                      style={{ 
                        borderRadius: 'var(--radius)',
                        ...typographyStyles.body,
                        fontWeight: 'var(--font-weight-regular)'
                      }}
                      disabled={teamsLoading || teams.length === 0}
                    >
                      {formData.teamId > 0
                        ? (() => {
                            const selectedTeam = teams.find((team) => team.id === formData.teamId) || teams[0];
                            return `${getTeamDisplayName(selectedTeam)} (${selectedTeam.location})`;
                          })()
                        : (teamsLoading ? "Loading teams..." : 
                           teams.length === 0 ? "No teams available" : 
                           "Select team to evaluate")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" style={{ borderRadius: 'var(--radius)' }}>
                    <Command>
                      <CommandInput 
                        placeholder="Search teams..." 
                        className="h-9"
                        style={typographyStyles.body}
                      />
                      <CommandList>
                        <CommandEmpty style={typographyStyles.muted}>
                          No teams found.
                        </CommandEmpty>
                        <CommandGroup>
                          {teams.map((team) => (
                            <CommandItem
                              key={team.id}
                              value={getTeamDisplayName(team)}
                              onSelect={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  teamId: team.id
                                }));
                                setTeamDropdownOpen(false);
                              }}
                              style={typographyStyles.body}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.teamId === team.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {getTeamDisplayName(team)} ({team.location})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Evaluation Questions Section */}
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-4">
              <div>
                <h4 style={{ 
                  ...typographyStyles.h4,
                  marginBottom: '12px'
                }}>
                  {index + 1}. {question.text}
                </h4>
              </div>
              
              <RadioGroup
                value={formData[question.id as keyof FormData]}
                onValueChange={(value) => handleValueChange(question.id, value)}
                className="grid grid-cols-1 md:grid-cols-5 gap-4"
              >
                {scaleOptions.map((option) => (
                  <div key={option.value} className="relative">
                    <RadioGroupItem 
                      value={option.value} 
                      id={`${question.id}-${option.value}`}
                      className="absolute opacity-0 w-full h-full cursor-pointer"
                    />
                    <Label 
                      htmlFor={`${question.id}-${option.value}`} 
                      className="flex items-center justify-center cursor-pointer p-3 rounded-md border border-border hover:bg-accent/10 transition-colors text-center w-full min-h-[48px]"
                      style={{ 
                        ...typographyStyles.label,
                        backgroundColor: formData[question.id as keyof FormData] === option.value ? 'var(--primary)' : 'transparent',
                        color: formData[question.id as keyof FormData] === option.value ? 'var(--primary-foreground)' : 'var(--foreground)',
                        borderColor: formData[question.id as keyof FormData] === option.value ? 'var(--primary)' : 'var(--border)'
                      }}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
          
          {error && (
            <div className="p-4 rounded-md border border-destructive bg-destructive/10 text-destructive" style={{ borderRadius: 'var(--radius)' }}>
              <p style={typographyStyles.body}>
                {error}
              </p>
            </div>
          )}
          
          <div className="pt-6 border-t border-border">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}