import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { typographyStyles } from '../utils/ui-helpers';
import { refreshSchemaCache } from '../utils/database-status';
import { Database, CheckCircle, RefreshCw } from 'lucide-react';

interface DatabaseSetupProps {
  hasError?: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
}

export function DatabaseSetup({ hasError = false, errorMessage, onRefresh }: DatabaseSetupProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    
    try {
      const result = await refreshSchemaCache();
      setRefreshMessage(result.message);
      
      // Wait a moment for the cache to refresh, then check status
      setTimeout(() => {
        onRefresh?.();
      }, 2000);
    } catch (error) {
      setRefreshMessage(error instanceof Error ? error.message : 'Failed to refresh schema cache');
    } finally {
      setIsRefreshing(false);
    }
  };
  return (
    <Card style={{ borderRadius: 'var(--radius-card)' }} className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-primary" />
          <div>
            <CardTitle style={typographyStyles.h2}>
              Database Setup Required
            </CardTitle>
            <CardDescription style={typographyStyles.muted}>
              Please set up your Supabase database tables to use this application
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {hasError && errorMessage && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertDescription className="text-destructive">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Special alert for location column missing error */}
        {errorMessage?.includes("location") && errorMessage?.includes("does not exist") && (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg" style={{ borderRadius: 'var(--radius)' }}>
            <div className="flex items-start space-x-3 mb-3">
              <Database className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p style={{ ...typographyStyles.body, fontWeight: 'var(--font-weight-semibold)' }}>
                  Database Schema Update Required
                </p>
                <p style={typographyStyles.muted} className="mt-1">
                  Your database is missing the new "location" field in the teams table. You have two options:
                </p>
              </div>
            </div>
            
            <div className="space-y-3 ml-8">
              <div>
                <p style={{ ...typographyStyles.body, fontWeight: 'var(--font-weight-semibold)' }}>
                  Option 1: Run Migration Script (Recommended)
                </p>
                <p style={typographyStyles.muted} className="text-sm">
                  Open the <code className="px-2 py-1 bg-muted rounded text-xs">/migration-script.sql</code> file, 
                  copy its contents, and run it in your Supabase SQL Editor. This will safely add the location column 
                  to your existing teams table without losing any data.
                </p>
              </div>
              
              <div>
                <p style={{ ...typographyStyles.body, fontWeight: 'var(--font-weight-semibold)' }}>
                  Option 2: Recreate Database Tables
                </p>
                <p style={typographyStyles.muted} className="text-sm">
                  Run the complete <code className="px-2 py-1 bg-muted rounded text-xs">/database-schema.sql</code> file 
                  in your Supabase SQL Editor. This will recreate all tables with the latest schema but will remove existing data.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <h3 style={typographyStyles.h3}>Setup Instructions:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mt-0.5">
                1
              </div>
              <div>
                <p style={typographyStyles.body}>
                  <strong>Open your Supabase Dashboard</strong>
                </p>
                <p style={typographyStyles.muted}>
                  Go to your Supabase project dashboard in your web browser
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mt-0.5">
                2
              </div>
              <div>
                <p style={typographyStyles.body}>
                  <strong>Navigate to SQL Editor</strong>
                </p>
                <p style={typographyStyles.muted}>
                  Click on "SQL Editor" in the left sidebar of your Supabase dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mt-0.5">
                3
              </div>
              <div>
                <p style={typographyStyles.body}>
                  <strong>Copy the Database Schema</strong>
                </p>
                <p style={typographyStyles.muted}>
                  Open the <code className="px-2 py-1 bg-muted rounded text-sm">/database-schema.sql</code> file in your project and copy all its contents
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mt-0.5">
                4
              </div>
              <div>
                <p style={typographyStyles.body}>
                  <strong>Run the SQL Script</strong>
                </p>
                <p style={typographyStyles.muted}>
                  Paste the schema into the SQL Editor and click "Run" to create all necessary tables and functions
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold mt-0.5">
                5
              </div>
              <div>
                <p style={typographyStyles.body}>
                  <strong>Refresh This Page</strong>
                </p>
                <p style={typographyStyles.muted}>
                  Once the SQL script runs successfully, refresh this page to start using the application
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg" style={{ borderRadius: 'var(--radius)' }}>
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <p style={{ ...typographyStyles.body, fontWeight: 'var(--font-weight-semibold)' }}>
                What the setup creates:
              </p>
            </div>
            <ul className="space-y-1 list-disc list-inside" style={typographyStyles.muted}>
              <li><code>teams</code> table - For managing participating teams</li>
              <li><code>evaluations</code> table - For storing judging form responses</li>
              <li>Database functions and views for analytics</li>
              <li>Row Level Security policies for data protection</li>
              <li>Indexes for optimal performance</li>
            </ul>
          </div>
          
          {errorMessage?.includes('schema cache') && (
            <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg" style={{ borderRadius: 'var(--radius)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-accent" />
                  <p style={{ ...typographyStyles.body, fontWeight: 'var(--font-weight-semibold)' }}>
                    Schema Cache Issue Detected
                  </p>
                </div>
              </div>
              <p style={typographyStyles.muted} className="mb-4">
                If you've already run the SQL script but still see errors, the database schema cache may need to be refreshed.
              </p>
              
              {refreshMessage && (
                <Alert className={`mb-4 ${refreshMessage.includes('success') ? 'border-accent bg-accent/10' : 'border-destructive bg-destructive/10'}`}>
                  <AlertDescription className={refreshMessage.includes('success') ? 'text-accent' : 'text-destructive'}>
                    {refreshMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleRefreshCache}
                  disabled={isRefreshing}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  style={{ borderRadius: 'var(--radius-button)' }}
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Schema Cache
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  style={{ borderRadius: 'var(--radius-button)' }}
                >
                  Reload Page
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}