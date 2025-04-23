import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, CircleCheck, BarChart4, Lightbulb, BookOpen, Clock } from 'lucide-react';
import { EssayNavigation } from '@/components/essay';

// Rich text editor for display only
const RichTextEditor = React.lazy(() => import('@/lib/RichTextEditor'));

interface EssayPrompt {
  id: number;
  title: string;
  description: string;
  taskType: 'issue' | 'argument';
  prompt: string;
  sampleEssay: string | null;
  difficultyLevel: number;
  tags: string[];
}

interface UserEssay {
  id: number;
  userId: number;
  promptId: number;
  content: string;
  wordCount: number;
  timeSpent: number;
  score?: number;
  feedback?: {
    overallScore: number;
    criteria: {
      structure: { score: number; feedback: string };
      clarity: { score: number; feedback: string };
      reasoning: { score: number; feedback: string };
      evidence: { score: number; feedback: string };
      grammar: { score: number; feedback: string };
    };
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    summary: string;
  };
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  prompt: EssayPrompt;
}

const EssayView: React.FC = () => {
  const { id: essayIdParam } = useParams<{ id?: string }>();
  const essayId = essayIdParam ? parseInt(essayIdParam, 10) : undefined;
  const [location, setLocation] = useLocation();
  
  // Load specific essay
  const { data: essay, isLoading } = useQuery({
    queryKey: ['/api/essays/user', essayId],
    queryFn: async () => {
      if (!essayId) return null;
      const response = await apiRequest<{ data: UserEssay }>(`/api/essays/user/${essayId}`);
      return response.data;
    },
    enabled: !!essayId,
  });
  
  // Format time spent
  const formatTimeSpent = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <EssayNavigation showBackButton={true} currentPage="view" />
        
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-full max-w-md">
                <Progress value={40} className="mb-4" />
                <p className="text-center text-muted-foreground">Loading essay details...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!essay) {
    return (
      <div className="container mx-auto py-6">
        <EssayNavigation showBackButton={true} currentPage="view" />
        
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center p-12">
              <h3 className="text-lg font-medium mb-2">Essay not found</h3>
              <p className="text-muted-foreground mb-6">
                The requested essay could not be found. It may have been deleted or you may not have permission to view it.
              </p>
              <Button onClick={() => setLocation('/essays/history')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <EssayNavigation showBackButton={true} currentPage="view" />
      
      {/* Essay Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{essay.prompt.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant={essay.prompt.taskType === 'issue' ? 'default' : 'secondary'}>
            {essay.prompt.taskType === 'issue' ? 'Issue Task' : 'Argument Task'}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {new Date(essay.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            {formatTimeSpent(essay.timeSpent)}
          </div>
          <div className="text-sm text-muted-foreground">
            {essay.wordCount} words
          </div>
          {essay.isCompleted ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Completed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              In Progress
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="essay" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompt">
            <BookOpen className="mr-2 h-4 w-4" /> Original Prompt
          </TabsTrigger>
          <TabsTrigger value="essay">
            <BookOpen className="mr-2 h-4 w-4" /> Your Essay
          </TabsTrigger>
          <TabsTrigger value="feedback" disabled={!essay.isCompleted || !essay.feedback}>
            <Lightbulb className="mr-2 h-4 w-4" /> Feedback
          </TabsTrigger>
        </TabsList>
        
        {/* Prompt Tab */}
        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>Essay Prompt</CardTitle>
              <CardDescription>The original prompt that you responded to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-md bg-slate-50">
                <p>{essay.prompt.prompt}</p>
              </div>
              
              {essay.prompt.tags && essay.prompt.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {essay.prompt.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Essay Tab */}
        <TabsContent value="essay">
          <Card>
            <CardHeader>
              <CardTitle>Your Essay</CardTitle>
              <CardDescription>
                Your written response to the prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 min-h-[400px]">
                <React.Suspense fallback={<div>Loading content...</div>}>
                  <RichTextEditor
                    initialValue={essay.content}
                    onChange={() => {}} // No changes allowed in view mode
                    readOnly={true}
                  />
                </React.Suspense>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Essay Feedback</CardTitle>
              <CardDescription>
                Analysis and evaluation of your essay based on GRE scoring criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!essay.isCompleted || !essay.feedback ? (
                <div className="text-center p-6">
                  <p className="text-muted-foreground">No feedback available for this essay.</p>
                </div>
              ) : (
                <>
                  {/* Overall Score */}
                  <div className="bg-slate-50 p-6 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-medium">Overall Score</h3>
                      <div className="text-3xl font-bold text-blue-600">
                        {essay.feedback.overallScore}/6
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      {essay.feedback.summary}
                    </p>
                  </div>
                  
                  {/* Criteria Scores */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Scoring Criteria</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(essay.feedback.criteria).map(([criterion, data]: [string, any]) => (
                        <div key={criterion} className="p-4 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium capitalize">{criterion}</h4>
                            <span className="font-bold">{data.score}/5</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{data.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-green-600 flex items-center">
                        <CircleCheck className="mr-2 h-5 w-5" /> Strengths
                      </h3>
                      <ul className="space-y-2">
                        {essay.feedback.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-amber-600 flex items-center">
                        <BarChart4 className="mr-2 h-5 w-5" /> Areas for Improvement
                      </h3>
                      <ul className="space-y-2">
                        {essay.feedback.weaknesses.map((weakness: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-amber-500 mr-2">•</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Suggestions */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Suggestions for Improvement</h3>
                    <ul className="space-y-2">
                      {essay.feedback.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="flex items-start p-2 border-b">
                          <span className="text-blue-500 mr-2">→</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setLocation('/essays/history')}>
                Back to Essay History
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EssayView;