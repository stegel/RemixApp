import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Trophy, Medal, Award, RefreshCw } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TeamData {
  teamName: string;
  evaluations: any[];
  totalEvaluations: number;
  averageScore: number;
  totalScore: number;
}

export function Leaderboard() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9605d89f/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch leaderboard');
      }

      setTeams(result.teams || []);

    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error(`Failed to load leaderboard: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="h-6 w-6 flex items-center justify-center text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-50 border-yellow-200";
      case 2:
        return "bg-gray-50 border-gray-200";
      case 3:
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-background border-border";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Team Leaderboard</CardTitle>
          <CardDescription>Loading results...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Leaderboard</CardTitle>
            <CardDescription>
              Rankings based on average scores from all evaluations
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLeaderboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No evaluations submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team, index) => {
              const rank = index + 1;
              return (
                <div
                  key={team.teamName}
                  className={`p-4 rounded-lg border-2 ${getRankColor(rank)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getRankIcon(rank)}
                      <div>
                        <h3 className="text-lg">{team.teamName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {team.totalEvaluations} evaluation{team.totalEvaluations !== 1 ? 's' : ''} received
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl">{team.averageScore.toFixed(2)}</div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                    </div>
                  </div>
                  
                  {/* Score breakdown for top 3 teams */}
                  {rank <= 3 && team.evaluations.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm mb-2">Recent Evaluations:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {team.evaluations.slice(0, 3).map((evaluation, idx) => (
                          <div key={idx} className="bg-background p-2 rounded text-sm">
                            <p className="text-xs text-muted-foreground">Judge: {evaluation.judgeName}</p>
                            <div className="flex justify-between">
                              <span>AI Tools:</span>
                              <Badge variant="secondary" className="text-xs">{evaluation.scores.aiToolsUsage}/10</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Quality:</span>
                              <Badge variant="secondary" className="text-xs">{evaluation.scores.presentationQuality}/10</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Innovation:</span>
                              <Badge variant="secondary" className="text-xs">{evaluation.scores.innovation}/10</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}