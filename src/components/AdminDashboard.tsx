import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from './ui/alert-dialog';
import { EvaluationsTable } from './EvaluationsTable';
import { AnalyticsTable } from './AnalyticsTable';
import { SimpleTeamSummary } from './SimpleTeamSummary';
import { TeamsManagement } from './TeamsManagement';
import { fetchEvaluations, fetchAnalytics, deleteEvaluation, deleteAllEvaluations, deleteAllTeams, Evaluation, TeamAnalytics } from '../utils/api';
import { typographyStyles } from '../utils/ui-helpers';
import { Trash2 } from 'lucide-react';
// import { AdminAuth } from './admin/AdminAuth';
// import { AdminNavigation } from './admin/AdminNavigation';
// import { LocationTabs } from './admin/LocationTabs';
// import { ErrorDisplay } from './admin/ErrorDisplay';
// import { EvaluationsFilters } from './admin/EvaluationsFilters';
// import { AdminTabId, LocationValue } from './admin/constants';

type AdminTabId = 'evaluations' | 'analytics' | 'summary' | 'teams';
type LocationValue = '__all__' | 'Americas' | 'Amsterdam' | 'Hyderabad';

function isDatabaseError(error: string | null | undefined): boolean {
  return !!error && error.includes('Could not find the table');
}

function isSchemaUpdateRequired(error: string | null | undefined): boolean {
  return !!error && error.includes('location') && error.includes('does not exist');
}

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [analytics, setAnalytics] = useState<TeamAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTabId>('summary');
  const [filterTeam, setFilterTeam] = useState<string>('__all__');
  const [filterParticipant, setFilterParticipant] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<LocationValue>('__all__');

  const loadEvaluations = async () => {
    try {
      const teamFilter = filterTeam === '__all__' ? '' : filterTeam;
      const data = await fetchEvaluations(teamFilter, filterParticipant);
      setEvaluations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evaluations';
      if (isDatabaseError(errorMessage)) {
        setError('Database tables not found. Please run the database schema SQL script in your Supabase SQL Editor first.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      if (isDatabaseError(errorMessage)) {
        setError('Database tables not found. Please run the database schema SQL script in your Supabase SQL Editor first.');
      } else if (isSchemaUpdateRequired(errorMessage)) {
        setError('Database schema update required: The teams table is missing the "location" column. Please run the migration script from /migration-script.sql to add this field.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleDeleteEvaluation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this evaluation?')) {
      return;
    }

    try {
      await deleteEvaluation(id);
      await loadEvaluations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete evaluation');
    }
  };

  const handleDeleteAllEvaluations = async () => {
    try {
      setLoading(true);
      const result = await deleteAllEvaluations();
      await loadEvaluations();
      await loadAnalytics(); // Refresh analytics too since they depend on evaluations
      setError(null);
      // Could show a success message here if desired
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete all evaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllTeams = async () => {
    try {
      setLoading(true);
      const result = await deleteAllTeams();
      await loadAnalytics(); // Refresh analytics since they depend on teams
      setError(null);
      // Could show a success message here if desired
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete all teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (activeTab === 'evaluations') {
          await loadEvaluations();
        } else if (activeTab === 'analytics' || activeTab === 'summary') {
          await loadAnalytics();
        }
        // Teams tab handles its own loading
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, filterTeam, filterParticipant]);

  const uniqueTeams = [...new Set(evaluations.map(e => e.team_name))];

  // Show password screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card style={{ borderRadius: 'var(--radius-card)' }}>
          <CardHeader className="text-center">
            <CardTitle style={typographyStyles.h2}>
              Admin Access Required
            </CardTitle>
            <CardDescription style={typographyStyles.muted}>
              Please enter the admin password to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const password = formData.get('password') as string;
              if (password === 'remix2025') {
                setIsAuthenticated(true);
              } else {
                alert('Incorrect password');
              }
            }} className="space-y-4">
              <input
                type="password"
                name="password"
                placeholder="Enter admin password"
                className="w-full p-2 border border-border"
                style={{ borderRadius: 'var(--radius-button)', backgroundColor: 'var(--input-background)' }}
                required
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground p-2"
                style={{ borderRadius: 'var(--radius-button)' }}
              >
                Access Dashboard
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card style={{ borderRadius: 'var(--radius-card)' }}>
        <CardHeader>
          <CardTitle style={typographyStyles.h2}>
            Admin Dashboard
          </CardTitle>
          <CardDescription style={typographyStyles.muted}>
            View team performance summaries, manage evaluations, and analyze detailed metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="flex space-x-2 mb-6 p-2 border border-border"
            style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--card)' }}
          >
            {['evaluations', 'summary', 'analytics', 'teams'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as AdminTabId)}
                className={activeTab === tab ? 'bg-primary text-primary-foreground px-4 py-2' : 'bg-muted px-4 py-2'}
                style={{ borderRadius: 'var(--radius-button)' }}
              >
                {tab === 'evaluations' ? 'Evaluations' :
                 tab === 'summary' ? 'Team Summary' :
                 tab === 'analytics' ? 'Detailed Analytics' : 'Teams'}
              </button>
            ))}
          </div>

          {error && <div className="p-4 rounded-md border border-destructive bg-destructive/10 text-destructive mb-6">{error}</div>}

          {activeTab === 'evaluations' && (
            <>
              <div className="mb-4 flex flex-wrap gap-4 items-end">
                <div>
                  <label style={{ ...typographyStyles.label, display: 'block', marginBottom: '4px' }}>Filter by Team:</label>
                  <select
                    value={filterTeam}
                    onChange={(e) => setFilterTeam(e.target.value)}
                    className="px-3 py-2 border border-border"
                    style={{ borderRadius: 'var(--radius-button)', backgroundColor: 'var(--input-background)' }}
                  >
                    <option value="__all__">All Teams</option>
                    {uniqueTeams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ ...typographyStyles.label, display: 'block', marginBottom: '4px' }}>Filter by Participant:</label>
                  <input
                    type="text"
                    value={filterParticipant}
                    onChange={(e) => setFilterParticipant(e.target.value)}
                    placeholder="Enter participant name"
                    className="px-3 py-2 border border-border"
                    style={{ borderRadius: 'var(--radius-button)', backgroundColor: 'var(--input-background)' }}
                  />
                </div>
                <div className="ml-auto">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={loading || evaluations.length === 0}
                        style={{ borderRadius: 'var(--radius-button)' }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Evaluations
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent style={{ borderRadius: 'var(--radius-card)' }}>
                      <AlertDialogHeader>
                        <AlertDialogTitle style={typographyStyles.h3}>
                          Delete All Evaluations
                        </AlertDialogTitle>
                        <AlertDialogDescription style={typographyStyles.muted}>
                          This action cannot be undone. This will permanently delete all {evaluations.length} evaluations from the database.
                          <br /><br />
                          <strong>Are you absolutely sure you want to continue?</strong>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel style={{ borderRadius: 'var(--radius-button)' }}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAllEvaluations}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          style={{ borderRadius: 'var(--radius-button)' }}
                        >
                          Yes, Delete All Evaluations
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {loading ? (
                <p style={typographyStyles.muted}>Loading evaluations...</p>
              ) : (
                <EvaluationsTable evaluations={evaluations} onDelete={handleDeleteEvaluation} />
              )}
            </>
          )}

          {activeTab === 'summary' && (
            <>
              {loading ? (
                <p style={typographyStyles.muted}>Loading team summary...</p>
              ) : (
                <div>
                  <div className="mb-6">
                    <div 
                      className="grid w-full grid-cols-4 gap-1 bg-muted p-1 border border-border" 
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      {[
                        { value: '__all__', label: 'All Locations' },
                        { value: 'Americas', label: 'Americas' },
                        { value: 'Amsterdam', label: 'Amsterdam' },
                        { value: 'Hyderabad', label: 'Hyderabad' }
                      ].map(location => (
                        <button
                          key={location.value}
                          onClick={() => setFilterLocation(location.value as LocationValue)}
                          className={filterLocation === location.value ? 
                            'bg-primary text-primary-foreground px-3 py-2 flex flex-col items-center' : 
                            'px-3 py-2 flex flex-col items-center'}
                          style={{ borderRadius: 'var(--radius-button)' }}
                        >
                          <span>{location.label}</span>
                          <span style={{ fontSize: 'var(--text-label)', opacity: 0.7 }}>
                            ({location.value === '__all__' ? analytics.length : 
                              analytics.filter(team => team.location === location.value).length} teams)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SimpleTeamSummary 
                      analytics={filterLocation === '__all__' ? 
                        analytics : 
                        analytics.filter(team => team.location === filterLocation)
                      } 
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'analytics' && (
            <>
              {loading ? (
                <p style={typographyStyles.muted}>Loading detailed analytics...</p>
              ) : (
                <AnalyticsTable analytics={analytics} />
              )}
            </>
          )}

          {activeTab === 'teams' && <TeamsManagement />}
        </CardContent>
      </Card>
    </div>
  );
}