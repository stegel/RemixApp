import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";
import { api, JudgingSubmission, AI_TOOLS_CATEGORIES, AI_TOOLS_SCALE_LABELS, EVALUATION_SCALE_LABELS, EVALUATION_SCALE_VALUES } from "../utils/api";

interface AIToolsScores {
  synthesizingResearch: number;
  reviewingTranscripts: number;
  serviceBlueprintJourneyMap: number;
  summarizeProductDocs: number;
  generateDesignConcepts: number;
  generateMessagingUI: number;
  updatingUICopy: number;
  generateResearchPlan: number;
  draftingProductDocs: number;
  generateMultimediaContent: number;
  createReleasePosts: number;
}

interface JudgingCriteria {
  aiToolsScores: AIToolsScores;
  solutionDescription: number; // 0=Did not demonstrate, 1=Basic, 2=Thoughtful, 3=Extraordinary
  exRolesContribution: number; // 0=Did not demonstrate, 1=Basic, 2=Thoughtful, 3=Extraordinary
  learnedNewTechnique: boolean;
}

export function JudgingForm() {
  const [teamName, setTeamName] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [scores, setScores] = useState<JudgingCriteria>({
    aiToolsScores: {
      synthesizingResearch: 0,
      reviewingTranscripts: 0,
      serviceBlueprintJourneyMap: 0,
      summarizeProductDocs: 0,
      generateDesignConcepts: 0,
      generateMessagingUI: 0,
      updatingUICopy: 0,
      generateResearchPlan: 0,
      draftingProductDocs: 0,
      generateMultimediaContent: 0,
      createReleasePosts: 0,
    },
    solutionDescription: EVALUATION_SCALE_VALUES.didNotDemonstrate,
    exRolesContribution: EVALUATION_SCALE_VALUES.didNotDemonstrate,
    learnedNewTechnique: false,
  });
  const [comments, setComments] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const result = await api.getTeams();
        setTeams(result.teams);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams. Please refresh the page.');
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  const updateAIToolScore = (tool: keyof AIToolsScores, value: number[]) => {
    setScores(prev => ({
      ...prev,
      aiToolsScores: {
        ...prev.aiToolsScores,
        [tool]: value[0]
      }
    }));
  };

  const updateLearnedNewTechnique = (value: string) => {
    setScores(prev => ({
      ...prev,
      learnedNewTechnique: value === 'yes'
    }));
  };

  const updateSolutionDescription = (value: string) => {
    setScores(prev => ({
      ...prev,
      solutionDescription: EVALUATION_SCALE_VALUES[value as keyof typeof EVALUATION_SCALE_VALUES]
    }));
  };

  const updateExRolesContribution = (value: string) => {
    setScores(prev => ({
      ...prev,
      exRolesContribution: EVALUATION_SCALE_VALUES[value as keyof typeof EVALUATION_SCALE_VALUES]
    }));
  };

  const getEvaluationLabel = (value: number) => {
    const labelMap = {
      [EVALUATION_SCALE_VALUES.didNotDemonstrate]: 'Did not demonstrate',
      [EVALUATION_SCALE_VALUES.basic]: 'Basic',
      [EVALUATION_SCALE_VALUES.thoughtful]: 'Thoughtful',
      [EVALUATION_SCALE_VALUES.extraordinary]: 'Extraordinary'
    };
    return labelMap[value] || 'Did not demonstrate';
  };

  const getEvaluationKey = (value: number) => {
    const keyMap = {
      [EVALUATION_SCALE_VALUES.didNotDemonstrate]: 'didNotDemonstrate',
      [EVALUATION_SCALE_VALUES.basic]: 'basic',
      [EVALUATION_SCALE_VALUES.thoughtful]: 'thoughtful',
      [EVALUATION_SCALE_VALUES.extraordinary]: 'extraordinary'
    };
    return keyMap[value] || 'didNotDemonstrate';
  };

  const calculateAIToolsTotal = () => {
    return Object.values(scores.aiToolsScores).reduce((sum, score) => sum + score, 0);
  };

  const calculateAIToolsAverage = () => {
    const total = calculateAIToolsTotal();
    return (total / Object.keys(scores.aiToolsScores).length).toFixed(1);
  };

  const calculateTotalScore = () => {
    return calculateAIToolsTotal() + scores.solutionDescription + scores.exRolesContribution;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim() || !judgeName.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const submission: JudgingSubmission = {
        teamName: teamName.trim(),
        judgeName: judgeName.trim(),
        scores,
        comments: comments.trim(),
      };

      const result = await api.submitEvaluation(submission);
      
      if (result.success) {
        setIsSubmitted(true);
        toast.success("Evaluation submitted successfully!");
        console.log("Evaluation submitted with ID:", result.evaluationId);
      } else {
        throw new Error("Failed to submit evaluation");
      }
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast.error("Failed to submit evaluation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTeamName("");
    setJudgeName("");
    setScores({
      aiToolsScores: {
        synthesizingResearch: 0,
        reviewingTranscripts: 0,
        serviceBlueprintJourneyMap: 0,
        summarizeProductDocs: 0,
        generateDesignConcepts: 0,
        generateMessagingUI: 0,
        updatingUICopy: 0,
        generateResearchPlan: 0,
        draftingProductDocs: 0,
        generateMultimediaContent: 0,
        createReleasePosts: 0,
      },
      solutionDescription: EVALUATION_SCALE_VALUES.didNotDemonstrate,
      exRolesContribution: EVALUATION_SCALE_VALUES.didNotDemonstrate,
      learnedNewTechnique: false,
    });
    setComments("");
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">Evaluation Submitted!</CardTitle>
          <CardDescription>
            Your evaluation for team "{teamName}" has been successfully submitted and saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-6 rounded-lg">
            <h3 className="mb-4">Submitted Scores:</h3>
            
            {/* AI Tools Scores */}
            <div className="mb-6">
              <h4 className="mb-3">AI Tools Usage</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AI_TOOLS_CATEGORIES.map((category) => (
                  <div key={category.key} className="flex justify-between items-center">
                    <span className="text-sm">{category.label}</span>
                    <Badge variant="secondary">{scores.aiToolsScores[category.key]}/3</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between">
                  <span>AI Tools Total:</span>
                  <span>{calculateAIToolsTotal()}/33</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Tools Average:</span>
                  <span>{calculateAIToolsAverage()}/3</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Other Evaluation Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Solution Description</p>
                <p className="text-2xl">{getEvaluationLabel(scores.solutionDescription)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">EX Roles Contribution</p>
                <p className="text-2xl">{getEvaluationLabel(scores.exRolesContribution)}</p>
              </div>
            </div>

            <Separator />

            {/* Learning */}
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">Learned New Technique</p>
              <p className="text-2xl">{scores.learnedNewTechnique ? 'Yes' : 'No'}</p>
            </div>
            
            <div className="text-center mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className="text-3xl">{calculateTotalScore()}</p>
            </div>
          </div>
          <Button onClick={resetForm} className="w-full">
            Judge Another Team
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Team Presentation Evaluation</CardTitle>
        <CardDescription>
          Please evaluate the team's presentation based on the criteria below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Team and Judge Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Being Judged *</Label>
              {loadingTeams ? (
                <div className="h-10 bg-muted animate-pulse rounded-md"></div>
              ) : teams.length > 0 ? (
                <Select value={teamName} onValueChange={setTeamName} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team to judge" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.name}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted">
                  No teams available. Please ask an admin to add teams first.
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="judge-name">Your Name *</Label>
              <Input
                id="judge-name"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                placeholder="Enter your name"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* AI Tools Usage Section */}
          <div className="space-y-6">
            <div>
              <h3>AI Tools Usage</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Rate each AI tool usage category on a scale from 0 (Did not use) to 3 (Exemplary usage).
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {AI_TOOLS_CATEGORIES.map((category, index) => (
                <div key={category.key} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      {index + 1}. {category.label}
                    </Label>
                    <Badge variant="secondary">
                      {scores.aiToolsScores[category.key]}/3
                    </Badge>
                  </div>
                  <Slider
                    value={[scores.aiToolsScores[category.key]]}
                    onValueChange={(value) => updateAIToolScore(category.key, value)}
                    min={0}
                    max={3}
                    step={1}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Did not use (0)</span>
                    <span>Exemplary (3)</span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Tools Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="mb-3">AI Tools Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-xl">{calculateAIToolsTotal()}/33</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-xl">{calculateAIToolsAverage()}/3</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Other Evaluation Criteria */}
          <div className="space-y-6">
            <h3>Other Evaluation Criteria</h3>
            
            {/* Solution Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Solution description and AI contribution</Label>
                <Badge variant="secondary">{getEvaluationLabel(scores.solutionDescription)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                The team's presentation clearly described their proposed solution and how AI contributed to the outcome.
              </p>
              <RadioGroup
                value={getEvaluationKey(scores.solutionDescription)}
                onValueChange={updateSolutionDescription}
                disabled={isSubmitting}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="didNotDemonstrate" id="solution-didNotDemonstrate" />
                  <Label htmlFor="solution-didNotDemonstrate">Did not demonstrate - No clear solution or AI contribution described</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="solution-basic" />
                  <Label htmlFor="solution-basic">Basic - Limited clarity on solution and AI contribution</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="thoughtful" id="solution-thoughtful" />
                  <Label htmlFor="solution-thoughtful">Thoughtful - Clear description of solution and AI role</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="extraordinary" id="solution-extraordinary" />
                  <Label htmlFor="solution-extraordinary">Extraordinary - Exceptional clarity on solution and AI impact</Label>
                </div>
              </RadioGroup>
            </div>

            {/* EX Roles Contribution */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Demonstrates how EX roles contribute to better outcomes</Label>
                <Badge variant="secondary">{getEvaluationLabel(scores.exRolesContribution)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                How well does the team demonstrate how experience roles (content, research, design) contribute to better outcomes?
              </p>
              <RadioGroup
                value={getEvaluationKey(scores.exRolesContribution)}
                onValueChange={updateExRolesContribution}
                disabled={isSubmitting}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="didNotDemonstrate" id="ex-didNotDemonstrate" />
                  <Label htmlFor="ex-didNotDemonstrate">Did not demonstrate - No clear demonstration of EX role value</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="ex-basic" />
                  <Label htmlFor="ex-basic">Basic - Limited demonstration of EX role value</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="thoughtful" id="ex-thoughtful" />
                  <Label htmlFor="ex-thoughtful">Thoughtful - Clear demonstration of how EX roles add value</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="extraordinary" id="ex-extraordinary" />
                  <Label htmlFor="ex-extraordinary">Extraordinary - Exceptional demonstration of EX role impact</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Learning Question */}
            <div className="space-y-3">
              <Label>I learned a new technique from the team's presentation</Label>
              <p className="text-sm text-muted-foreground">
                Did you learn something new from watching this team's presentation?
              </p>
              <RadioGroup
                value={scores.learnedNewTechnique ? 'yes' : 'no'}
                onValueChange={updateLearnedNewTechnique}
                disabled={isSubmitting}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="learned-yes" />
                  <Label htmlFor="learned-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="learned-no" />
                  <Label htmlFor="learned-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide any additional feedback or comments..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Overall Score Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="mb-3">Score Summary</h4>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className="text-xl">{calculateTotalScore()}</p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || teams.length === 0}>
            {isSubmitting ? "Submitting..." : "Submit Evaluation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}