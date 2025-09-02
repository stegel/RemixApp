import React, { useState, useEffect } from 'react';
import { JudgingForm } from './components/JudgingForm';
import { AdminDashboard } from './components/AdminDashboard';
import { DatabaseSetup } from './components/DatabaseSetup';
import { Button } from './components/ui/button';
import { checkDatabaseStatus, DatabaseStatus, refreshSchemaCache } from './utils/database-status';
import { RefreshCw } from 'lucide-react';
import logoImage from 'figma:asset/dfe0aec21d1e3b52b0e6ae5edc87b575eb3c88e6.png';

export default function App() {
  const [activeView, setActiveView] = useState<'form' | 'admin'>('form');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ isConnected: false, tablesExist: false });
  const [dbStatusLoading, setDbStatusLoading] = useState(true);

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
                Make sure at least 3 of your team mates judge each presentation you see
              </p>
              <div className="mt-2 flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  dbStatusLoading ? 'bg-muted-foreground' : 
                  dbStatus.tablesExist ? 'bg-accent' : 
                  dbStatus.isConnected ? 'bg-primary' : 'bg-destructive'
                }`}></div>
                <span style={{ 
                  fontFamily: 'var(--font-family-lato)', 
                  fontSize: 'var(--text-label)', 
                  fontWeight: 'var(--font-weight-regular)',
                  color: dbStatusLoading ? 'var(--muted-foreground)' :
                         dbStatus.tablesExist ? 'var(--accent)' : 
                         dbStatus.isConnected ? 'var(--primary)' : 'var(--destructive)'
                }}>
                  {dbStatusLoading ? 'Checking database...' :
                   dbStatus.tablesExist ? 'Database Ready' :
                   dbStatus.isConnected ? 'Database Setup Required' : 'Database Connection Error'}
                </span>
                {dbStatus.isConnected && !dbStatusLoading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setDbStatusLoading(true);
                      try {
                        await refreshSchemaCache();
                        setTimeout(async () => {
                          const status = await checkDatabaseStatus();
                          setDbStatus(status);
                          setDbStatusLoading(false);
                        }, 2000);
                      } catch (error) {
                        setDbStatusLoading(false);
                      }
                    }}
                    className="h-6 px-2 text-xs"
                    style={{ borderRadius: 'var(--radius-button)' }}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          {dbStatus.tablesExist && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => setActiveView('form')}
                variant={activeView === 'form' ? 'default' : 'outline'}
                className={activeView === 'form' ? 'bg-primary text-primary-foreground' : ''}
                style={{ borderRadius: 'var(--radius-button)' }}
              >
                Submit Evaluation
              </Button>
              <Button
                onClick={() => setActiveView('admin')}
                variant={activeView === 'admin' ? 'default' : 'outline'}
                className={activeView === 'admin' ? 'bg-primary text-primary-foreground' : ''}
                style={{ borderRadius: 'var(--radius-button)' }}
              >
                Admin Dashboard
              </Button>
            </div>
          )}
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
        ) : (
          activeView === 'form' ? <JudgingForm /> : <AdminDashboard />
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