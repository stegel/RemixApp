import { useState } from "react";
import { JudgingForm } from "./components/JudgingForm";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { AdminPage } from "./components/AdminPage";
import { AdminLogin } from "./components/AdminLogin";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import {
  BarChart3,
  ClipboardList,
  Home,
  Settings,
  LogOut,
} from "lucide-react";
import navLogo from "figma:asset/27c0a819fb0f073a52b84d71b730ef7164a6f413.png";
import bannerLogo from "figma:asset/dfe0aec21d1e3b52b0e6ae5edc87b575eb3c88e6.png";

export default function App() {
  const [currentView, setCurrentView] = useState<
    "home" | "judge" | "results" | "admin" | "admin-login"
  >("home");
  const [isAdminAuthenticated, setIsAdminAuthenticated] =
    useState(false);

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setCurrentView("admin");
    } else {
      setCurrentView("admin-login");
    }
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setCurrentView("admin");
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentView("home");
  };

  const renderView = () => {
    switch (currentView) {
      case "judge":
        return <JudgingForm />;
      case "results":
        return <ResultsDashboard />;
      case "admin":
        return isAdminAuthenticated ? (
          <AdminPage />
        ) : (
          <AdminLogin
            onLogin={handleAdminLogin}
            onCancel={() => setCurrentView("home")}
          />
        );
      case "admin-login":
        return (
          <AdminLogin
            onLogin={handleAdminLogin}
            onCancel={() => setCurrentView("home")}
          />
        );
      default:
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Banner Logo */}
            <div className="text-center mb-8">
              <img
                src={bannerLogo}
                alt="ServiceNow ReMix"
                className="mx-auto mb-6 h-20 w-auto"
              />
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-8">
                  <h2 className="mb-2">
                    AI in The Mix: Experience Simulation
                  </h2>
                  <h3 className="mb-4">Team evaluations</h3>
                  <p className="text-muted-foreground">
                    Please complete the evaluation form for each
                    team presentation you watch. Each member of
                    your team should complete their own
                    evaluation of each team.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button
                    variant="outline"
                    className="h-32 flex-col space-y-2"
                    onClick={() => setCurrentView("judge")}
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
                    onClick={() => setCurrentView("results")}
                  >
                    <BarChart3 className="w-8 h-8" />
                    <div className="text-center">
                      <div>View Results</div>
                      <div className="text-sm text-muted-foreground">
                        See team rankings and scores
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={navLogo}
                alt="ServiceNow"
                className="h-8 w-8"
              />
              <div className="hidden md:flex flex-col">
                <span className="text-lg">ReMix 2025</span>
                <span className="text-sm text-muted-foreground">
                  AI in the Mix: Experience Simulation
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={
                  currentView === "home" ? "default" : "ghost"
                }
                size="sm"
                onClick={() => setCurrentView("home")}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant={
                  currentView === "judge" ? "default" : "ghost"
                }
                size="sm"
                onClick={() => setCurrentView("judge")}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Judge
              </Button>
              <Button
                variant={
                  currentView === "results"
                    ? "default"
                    : "ghost"
                }
                size="sm"
                onClick={() => setCurrentView("results")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Results
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        {renderView()}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 ServiceNow EXperience Organization
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminAccess}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                Administration
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
      </footer>

      <Toaster />
    </div>
  );
}