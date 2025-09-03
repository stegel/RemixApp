import React, { useState, useEffect } from 'react';
import { JudgingForm } from './components/JudgingForm';
import { AdminDashboard } from './components/AdminDashboard';
import { TeamRegistration } from './components/TeamRegistration';
import { DatabaseSetup } from './components/DatabaseSetup';
import { Button } from './components/ui/button';
import { checkDatabaseStatus, DatabaseStatus } from './utils/database-status';
import logoImage from 'figma:asset/dfe0aec21d1e3b52b0e6ae5edc87b575eb3c88e6.png';

// Helper functions for URL routing
function getViewFromPath(pathname: string): 'form' | 'registration' | 'admin' {
  // Clean up the pathname to handle various formats
  const cleanPath = pathname.toLowerCase().replace(/\/$/, '') || '/';
  
  if (cleanPath === '/registration' || cleanPath.endsWith('/registration')) return 'registration';
  if (cleanPath === '/admin' || cleanPath.endsWith('/admin')) return 'admin';
  if (cleanPath === '/form' || cleanPath.endsWith('/form')) return 'form';
  return 'form'; // default to form for '/' and other paths
}

function getPathFromView(view: 'form' | 'registration' | 'admin'): string {
  if (view === 'registration') return '/registration';
  if (view === 'admin') return '/admin';
  return '/form';
}

export default function App() {
  const [activeView, setActiveView] = useState<'form' | 'registration' | 'admin'>(() => 
    getViewFromPath(window.location.pathname)
  );
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ isConnected: false, tablesExist: false });
  const [dbStatusLoading, setDbStatusLoading] = useState(true);

  // Handle navigation
  const navigateToView = (view: 'form' | 'registration' | 'admin') => {
    const path = getPathFromView(view);
    window.history.pushState(null, '', path);
    setActiveView(view);
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkDatabaseStatus();
        setDbStatus(status);
      } catch (error) {
        setDbStatus({
          isConnected: false,
          tablesExist: false,
          error: 'Failed to check database status'
        });
      } finally {
        setDbStatusLoading(false);
      }
    };

    checkStatus();
  }, []);

  // Listen for browser navigation (back/forward buttons) and handle direct URL access
  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getViewFromPath(window.location.pathname));
    };

    // Also check for direct URL access on mount
    const currentView = getViewFromPath(window.location.pathname);
    if (currentView !== activeView) {
      setActiveView(currentView);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full py-8 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <img 
              src={logoImage} 
              alt="ServiceNow ReMix Logo" 
              className="h-16 w-auto"
            />
            <div className="text-center">
              <h1 style={{ 
                fontFamily: 'var(--font-family-cabin)', 
                fontSize: 'var(--text-h1)', 
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
                marginBottom: '8px'
              }}>
                AI in The Mix: Experience Simulation
              </h1>
              <p style={{ 
                fontFamily: 'var(--font-family-lato)', 
                fontSize: 'var(--text-base)', 
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)'
              }}>
                Please make sure to judge every presentation you hear. We want each team to have at least 3 evaluations submitted.
              </p>
            </div>
          </div>
          
          {/* Navigation - Always show navigation for better UX */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <Button
              onClick={() => navigateToView('form')}
              variant={activeView === 'form' ? 'default' : 'outline'}
              className={activeView === 'form' ? 'bg-primary text-primary-foreground' : ''}
              style={{ borderRadius: 'var(--radius-button)' }}
              disabled={!dbStatus.tablesExist && !dbStatusLoading}
            >
              Submit Evaluation
            </Button>
            <Button
              onClick={() => navigateToView('registration')}
              variant={activeView === 'registration' ? 'default' : 'outline'}
              className={activeView === 'registration' ? 'bg-primary text-primary-foreground' : ''}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Team Registration
            </Button>
            <Button
              onClick={() => navigateToView('admin')}
              variant={activeView === 'admin' ? 'default' : 'outline'}
              className={activeView === 'admin' ? 'bg-primary text-primary-foreground' : ''}
              style={{ borderRadius: 'var(--radius-button)' }}
              disabled={!dbStatus.tablesExist && !dbStatusLoading}
            >
              Admin Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4">
        {!dbStatusLoading && !dbStatus.tablesExist ? (
          <DatabaseSetup 
            hasError={!!dbStatus.error} 
            errorMessage={dbStatus.error}
            onRefresh={async () => {
              setDbStatusLoading(true);
              const status = await checkDatabaseStatus();
              setDbStatus(status);
              setDbStatusLoading(false);
            }}
          />
        ) : dbStatusLoading ? (
          <div className="flex items-center justify-center py-12">
            <div style={{ 
              fontFamily: 'var(--font-family-lato)', 
              fontSize: 'var(--text-base)', 
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)'
            }}>
              Loading...
            </div>
          </div>
        ) : (
          <>
            {/* Render the correct view based on activeView */}
            {activeView === 'form' && <JudgingForm />}
            {activeView === 'registration' && <TeamRegistration />}
            {activeView === 'admin' && <AdminDashboard />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 border-t border-border mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p style={{ 
            fontFamily: 'var(--font-family-lato)', 
            fontSize: 'var(--text-label)', 
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)'
          }}>
            Your responses help us create better AI experiences
          </p>
        </div>
      </footer>
    </div>
  );
}