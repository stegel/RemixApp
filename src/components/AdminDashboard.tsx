import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { EvaluationsTable } from './EvaluationsTable';
import { AnalyticsTable } from './AnalyticsTable';
import { TeamSummaryTable } from './TeamSummaryTable';
import { TeamsManagement } from './TeamsManagement';
import { fetchEvaluations, fetchAnalytics, deleteEvaluation, Evaluation, TeamAnalytics } from '../utils/api';
import { typographyStyles } from '../utils/ui-helpers';
import { Lock } from 'lucide-react';

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [analytics, setAnalytics] = useState<TeamAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evaluations' | 'analytics' | 'summary' | 'teams'>('summary');
  const [filterTeam, setFilterTeam] = useState<string>('__all__');
  const [filterParticipant, setFilterParticipant] = useState<string>('');

  const loadEvaluations = async () => {
    try {
      const teamFilter = filterTeam === '__all__' ? '' : filterTeam;
      const data = await fetchEvaluations(teamFilter, filterParticipant);
      setEvaluations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evaluations';
      if (errorMessage.includes('Could not find the table')) {
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
      if (errorMessage.includes('Could not find the table')) {
        setError('Database tables not found. Please run the database schema SQL script in your Supabase SQL Editor first.');
      } else if (errorMessage.includes('location') && errorMessage.includes('does not exist')) {
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'remix2025') {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  // Show password screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card style={{ borderRadius: 'var(--radius-card)' }}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Lock className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle style={typographyStyles.h2}>
              Admin Access Required
            </CardTitle>
            <CardDescription style={typographyStyles.muted}>
              Please enter the admin password to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ borderRadius: 'var(--radius)' }}
                  className="w-full border-border"
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-destructive" style={{ 
                    fontFamily: 'var(--font-family-lato)', 
                    fontSize: 'var(--text-label)', 
                    fontWeight: 'var(--font-weight-regular)'
                  }}>
                    {passwordError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground"
                style={{ borderRadius: 'var(--radius-button)' }}
              >
                Access Dashboard
              </Button>
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
          <div className="flex space-x-2 mb-6">
            <Button
              onClick={() => setActiveTab('evaluations')}
              variant={activeTab === 'evaluations' ? 'default' : 'outline'}
              className={activeTab === 'evaluations' ? 'bg-primary text-primary-foreground' : ''}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Evaluations
            </Button>
            <Button
              onClick={() => setActiveTab('summary')}
              variant={activeTab === 'summary' ? 'default' : 'outline'}
              className={activeTab === 'summary' ? 'bg-primary text-primary-foreground' : ''}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Team Summary
            </Button>
            <Button
              onClick={() => setActiveTab('analytics')}
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              className={activeTab === 'analytics' ? 'bg-primary text-primary-foreground' : ''}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Detailed Analytics
            </Button>
            <Button
              onClick={() => setActiveTab('teams')}
              variant={activeTab === 'teams' ? 'default' : 'outline'}
              className={activeTab === 'teams' ? 'bg-primary text-primary-foreground' : ''}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Teams
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-md border border-destructive bg-destructive/10 text-destructive mb-6" style={{ borderRadius: 'var(--radius)' }}>
              <p>{error}</p>
              {error.includes('Database tables not found') && (
                <div className="mt-3 p-3 bg-muted rounded" style={{ borderRadius: 'var(--radius)' }}>
                  <p className="text-sm font-semibold mb-2 text-foreground">To fix this error:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
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

          {activeTab === 'evaluations' && (
            <>
              <div className="flex space-x-4 mb-6">
                <Input
                  placeholder="Filter by participant name..."
                  value={filterParticipant}
                  onChange={(e) => setFilterParticipant(e.target.value)}
                  className="max-w-sm border-border"
                  style={{ borderRadius: 'var(--radius)' }}
                />
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="max-w-sm border-border" style={{ borderRadius: 'var(--radius)' }}>
                    <SelectValue placeholder="Filter by team..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Teams</SelectItem>
                    {uniqueTeams.map((team) => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <TeamSummaryTable analytics={analytics} />
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