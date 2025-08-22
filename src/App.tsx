import { useState } from "react";
import { JudgingForm } from "./components/JudgingForm";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { AdminPage } from "./components/AdminPage";
import { AdminLogin } from "./components/AdminLogin";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { BarChart3, ClipboardList, Home, Settings, LogOut } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'judge' | 'results' | 'admin' | 'admin-login'>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setCurrentView('admin');
    } else {
      setCurrentView('admin-login');
    }
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentView('home');
  };

  const renderView = () => {
    switch (currentView) {
      case 'judge':
        return <JudgingForm />;
      case 'results':
        return <ResultsDashboard />;
      case 'admin':
        return isAdminAuthenticated ? <AdminPage /> : <AdminLogin onLogin={handleAdminLogin} onCancel={() => setCurrentView('home')} />;
      case 'admin-login':
        return <AdminLogin onLogin={handleAdminLogin} onCancel={() => setCurrentView('home')} />;
      default:
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-8">
                  <h2 className="mb-2">Welcome to the Judging System</h2>
                  <p className="text-muted-foreground">
                    Choose an action below to get started
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button
                    variant="outline"
                    className="h-32 flex-col space-y-2"
                    onClick={() => setCurrentView('judge')}
                  >
                    <ClipboardList className="w-8 h-8" />
                    <div className="text-center">
                      <div>Submit Evaluation</div>
                      <div className="text-sm text-muted-foreground">
                        Judge a team's presentation
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-32 flex-col space-y-2"
                    onClick={() => setCurrentView('results')}
                  >
                    <BarChart3 className="w-8 h-8" />
                    <div className="text-center">
                      <div>View Results</div>
                      <div className="text-sm text-muted-foreground">
                        See team rankings and scores
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-32 flex-col space-y-2"
                    onClick={handleAdminAccess}
                  >
                    <Settings className="w-8 h-8" />
                    <div className="text-center">
                      <div>Administration</div>
                      <div className="text-sm text-muted-foreground">
                        {isAdminAuthenticated ? 'Manage teams and evaluations' : 'Password protected'}
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-4">Evaluation Criteria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <h4 className="mb-2">AI Tools Usage</h4>
                    <p className="text-sm text-muted-foreground">
                      Rate 11 specific AI tool categories on a 0-3 scale (0=Did not use, 3=Exemplary usage). 
                      Categories include research synthesis, transcript review, design concepts, documentation, and more.
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2">Solution Clarity</h4>
                    <p className="text-sm text-muted-foreground">
                      How clearly the team's presentation described their proposed solution and how AI contributed to the outcome. 
                      Rated as Did not demonstrate, Basic, Thoughtful, or Extraordinary.
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2">EX Roles Impact</h4>
                    <p className="text-sm text-muted-foreground">
                      How well the team demonstrates how experience roles (content, research, design) contribute to better outcomes. 
                      Rated as Did not demonstrate, Basic, Thoughtful, or Extraordinary.
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2">Learning Impact</h4>
                    <p className="text-sm text-muted-foreground">
                      Simple yes/no question: "I learned a new technique from the team's presentation." 
                      Helps measure educational value.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl">Experience Simulation</h1>
              <span className="text-sm text-muted-foreground">Presentation Judging System</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant={currentView === 'home' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('home')}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button 
                variant={currentView === 'judge' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('judge')}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Judge
              </Button>
              <Button 
                variant={currentView === 'results' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('results')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Results
              </Button>
              <Button 
                variant={currentView === 'admin' || currentView === 'admin-login' ? 'default' : 'ghost'}
                size="sm"
                onClick={handleAdminAccess}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
              {isAdminAuthenticated && (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleAdminLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderView()}
      </main>

      <Toaster />
    </div>
  );
}