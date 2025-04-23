import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CircleCheck, ArrowLeft, Clock, PenLine, BookOpen, 
  Lightbulb, BarChart4, Timer, Save, Send, BrainCircuit, 
  AlertTriangle, CheckCircle2, XCircle, LayoutGrid, 
  Gauge, Award, GraduationCap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { EssayNavigation } from '@/components/essay';

// Rich text editor component
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
  createdAt: string;
  updatedAt: string;
}

interface EssayFeedback {
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
}

const EssayWriting: React.FC = () => {
  const { id: promptIdParam } = useParams<{ id?: string }>();
  const promptId = promptIdParam ? parseInt(promptIdParam, 10) : undefined;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State variables
  const [essayContent, setEssayContent] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60); // 30 minutes in seconds
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [essaySubmitted, setEssaySubmitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('prompt');
  const [essayId, setEssayId] = useState<number | null>(null);
  const [autoSaveIndicator, setAutoSaveIndicator] = useState<boolean>(false);
  const [timerWarning, setTimerWarning] = useState<boolean>(false);
  
  // Load essay prompts
  const { data: prompts, isLoading: promptsLoading } = useQuery<EssayPrompt[]>({
    queryKey: ['/api/essays/prompts'],
    queryFn: async () => {
      const response = await apiRequest<EssayPrompt[]>('/api/essays/prompts');
      return response || [];
    },
  });
  
  // Load specific prompt if ID is provided
  const { data: selectedPrompt, isLoading: promptLoading } = useQuery<EssayPrompt | null>({
    queryKey: ['/api/essays/prompts', promptId],
    queryFn: async () => {
      if (!promptId) return null;
      const response = await apiRequest<EssayPrompt>(`/api/essays/prompts/${promptId}`);
      return response;
    },
    enabled: !!promptId,
  });

  // Start essay mutation
  const startEssayMutation = useMutation({
    mutationFn: async (promptId: number) => {
      const response = await apiRequest('/api/essays/start', {
        method: 'POST',
        data: { promptId },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setEssayId(data.id);
      setTimerActive(true);
      setActiveTab('write');
      toast({
        title: 'Essay started',
        description: 'Your timer has started. You have 30 minutes to complete your essay.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to start the essay. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Save essay progress mutation
  const saveEssayMutation = useMutation({
    mutationFn: async () => {
      if (!essayId) throw new Error('No essay ID available');
      const response = await apiRequest(`/api/essays/save/${essayId}`, {
        method: 'PUT',
        data: {
          content: essayContent,
          wordCount,
          timeSpent: 30 * 60 - timeRemaining,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      setAutoSaveIndicator(true);
      setTimeout(() => setAutoSaveIndicator(false), 2000);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save your progress. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Submit essay mutation
  const submitEssayMutation = useMutation({
    mutationFn: async () => {
      if (!essayId) throw new Error('No essay ID available');
      const response = await apiRequest(`/api/essays/submit/${essayId}`, {
        method: 'POST',
        data: {
          content: essayContent,
          wordCount,
          timeSpent: 30 * 60 - timeRemaining,
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setEssaySubmitted(true);
      setTimerActive(false);
      setActiveTab('feedback');
      toast({
        title: 'Essay Submitted!',
        description: 'Your essay has been submitted successfully and is being evaluated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit your essay. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Update word count when essay content changes
  useEffect(() => {
    if (essayContent) {
      // Count words by splitting on whitespace and filtering out empty strings
      const words = essayContent.split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    } else {
      setWordCount(0);
    }
  }, [essayContent]);
  
  // Timer effect
  useEffect(() => {
    let timerId: number | undefined;
    
    if (timerActive && timeRemaining > 0) {
      timerId = window.setInterval(() => {
        setTimeRemaining(prev => {
          // Show warning when 5 minutes remain
          if (prev === 5 * 60) {
            setTimerWarning(true);
            toast({
              title: 'Time warning',
              description: 'You have 5 minutes remaining. Please prepare to finish your essay.',
              variant: 'default',
            });
          }
          
          if (prev <= 1) {
            clearInterval(timerId);
            // Auto-submit when time runs out
            if (essayId && essayContent && !essaySubmitted) {
              submitEssayMutation.mutate();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Auto-save every 60 seconds
    const autoSaveId = window.setInterval(() => {
      if (timerActive && essayId && essayContent && !essaySubmitted) {
        saveEssayMutation.mutate();
      }
    }, 60000);
    
    return () => {
      clearInterval(timerId);
      clearInterval(autoSaveId);
    };
  }, [timerActive, timeRemaining, essayId, essayContent, essaySubmitted]);
  
  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get time color based on remaining time
  const getTimeColor = (): string => {
    if (timeRemaining < 5 * 60) return 'text-red-500';
    if (timeRemaining < 10 * 60) return 'text-amber-500';
    return 'text-blue-600';
  };

  // Get word count color based on count
  const getWordCountColor = (): string => {
    if (wordCount < 150) return 'text-amber-500';
    if (wordCount > 450) return 'text-green-600';
    return 'text-blue-600';
  };
  
  // Start the essay writing process
  const handleStartEssay = () => {
    if (promptId) {
      startEssayMutation.mutate(promptId);
    } else {
      toast({
        title: 'Error',
        description: 'No essay prompt selected. Please select a prompt first.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle essay submission
  const handleSubmitEssay = () => {
    if (wordCount < 150) {
      toast({
        title: 'Essay too short',
        description: 'Your essay should be at least 150 words.',
        variant: 'destructive',
      });
      return;
    }
    
    submitEssayMutation.mutate();
  };
  
  // Return to prompt selection
  const handleBackToPrompts = () => {
    setLocation('/essays/prompts');
  };
  
  if (!promptId) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <EssayNavigation showBackButton={true} currentPage="writing" />
        
        <Alert className="mb-6 mt-6 bg-blue-50 border-blue-200">
          <AlertTriangle className="h-5 w-5 text-blue-800" />
          <AlertTitle className="text-blue-800 ml-2">No prompt selected</AlertTitle>
          <AlertDescription className="text-blue-700 ml-7">
            Please select an essay prompt from the essay prompts page to begin.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBackToPrompts} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Go to Essay Prompts
        </Button>
      </div>
    );
  }
  
  if (promptLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <EssayNavigation showBackButton={true} currentPage="writing" />
        
        <div className="flex flex-col items-center justify-center min-h-[400px] mt-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <PenLine className="h-10 w-10 text-blue-500" />
          </div>
          <Progress value={60} className="w-64 mb-6" />
          <p className="text-lg text-muted-foreground">Loading essay prompt...</p>
        </div>
      </div>
    );
  }
  
  if (!selectedPrompt) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <EssayNavigation showBackButton={true} currentPage="writing" />
        
        <Alert className="mb-6 mt-6 bg-red-50 border-red-200">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 ml-2">Prompt not found</AlertTitle>
          <AlertDescription className="text-red-700 ml-7">
            The selected essay prompt could not be found. Please select another prompt.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBackToPrompts} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Go to Essay Prompts
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container max-w-5xl mx-auto py-8">
      {/* Essay Navigation */}
      <EssayNavigation showBackButton={true} currentPage="writing" />
      
      {/* Status indicators */}
      {timerActive && !essaySubmitted && (
        <div className="flex items-center justify-end gap-4 mt-4 mb-6">
          <div className={`flex items-center gap-2 ${autoSaveIndicator ? 'text-green-600' : 'text-muted-foreground'} transition-colors duration-300`}>
            <Save className="h-4 w-4" />
            <span className="text-sm">{autoSaveIndicator ? 'Saved' : 'Auto-saving'}</span>
          </div>
          
          <div className={`flex items-center gap-2 ${getTimeColor()} font-medium`}>
            <Timer className="h-4 w-4" />
            <span className="text-sm">{formatTime(timeRemaining)}</span>
          </div>
          
          <div className={`flex items-center gap-2 ${getWordCountColor()} font-medium`}>
            <LayoutGrid className="h-4 w-4" />
            <span className="text-sm">{wordCount} words</span>
          </div>
        </div>
      )}
      
      {/* Essay task title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={selectedPrompt.taskType === 'issue' ? 'default' : 'secondary'} className="uppercase">
            {selectedPrompt.taskType === 'issue' ? 'Issue Task' : 'Argument Task'}
          </Badge>
          <span className="text-sm text-muted-foreground">Difficulty: {selectedPrompt.difficultyLevel}/5</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{selectedPrompt.title}</h1>
      </div>
      
      {/* Main content tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          // Only allow changing tabs if not in the middle of writing or if submitted
          if (!timerActive || essaySubmitted || value === 'prompt') {
            setActiveTab(value);
          }
        }} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger 
            value="prompt"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
            disabled={timerActive && !essaySubmitted}
          >
            <BookOpen className="mr-2 h-4 w-4" /> Prompt
          </TabsTrigger>
          <TabsTrigger 
            value="write"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
          >
            <PenLine className="mr-2 h-4 w-4" /> Write
          </TabsTrigger>
          <TabsTrigger 
            value="feedback"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
            disabled={!essaySubmitted}
          >
            <Lightbulb className="mr-2 h-4 w-4" /> Feedback
          </TabsTrigger>
        </TabsList>
        
        {/* Prompt Tab */}
        <TabsContent value="prompt">
          <Card className="bg-white dark:bg-gray-950 border border-blue-100 dark:border-blue-900 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Essay Prompt</CardTitle>
                  <CardDescription>
                    Read the prompt carefully before starting your timed essay
                  </CardDescription>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" /> Instructions
                </h3>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800">
                  <p className="text-muted-foreground">
                    {selectedPrompt.taskType === 'issue' ? (
                      'For this task, you will need to write a response discussing your views on the given issue. Consider various perspectives, provide examples, and articulate your position clearly. You have 30 minutes to plan and write your response.'
                    ) : (
                      'For this task, you will need to analyze the given argument and identify its logical flaws. Evaluate the reasoning, evidence, and assumptions. You have 30 minutes to plan and write your critique.'
                    )}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-blue-600" /> Prompt
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-md border border-blue-100 dark:border-blue-900/50 text-gray-800 dark:text-gray-100">
                  <p className="leading-relaxed">{selectedPrompt.prompt}</p>
                </div>
              </div>
              
              {selectedPrompt.description && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-blue-600" /> Context
                  </h3>
                  <p className="text-muted-foreground">{selectedPrompt.description}</p>
                </div>
              )}
              
              {selectedPrompt.tags.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-blue-600" /> Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrompt.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-slate-50 dark:bg-slate-900">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t border-blue-50 dark:border-blue-900/30 pt-4 pb-6 px-6">
              <Button 
                onClick={handleStartEssay} 
                disabled={startEssayMutation.isPending || essaySubmitted}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {startEssayMutation.isPending ? (
                  <>Starting...</>
                ) : essaySubmitted ? (
                  <>Essay Completed</>
                ) : (
                  <>
                    <Timer className="mr-2 h-4 w-4" /> Start 30-Minute Timer
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Write Tab */}
        <TabsContent value="write">
          <Card className={`bg-white dark:bg-gray-950 border shadow-sm ${timerWarning && timeRemaining > 0 ? 'border-amber-200 dark:border-amber-900/50' : 'border-blue-100 dark:border-blue-900/30'}`}>
            <CardHeader className={timerWarning && timeRemaining > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Write Your Essay
                    {timerWarning && timeRemaining > 0 && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 ml-2">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Time running out
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedPrompt.taskType === 'issue' ? 'Present your perspective on this issue' : 'Critique the logic of this argument'}
                  </CardDescription>
                </div>
                
                {timerActive && !essaySubmitted && (
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14">
                        <CircularProgressbar 
                          value={(timeRemaining / (30 * 60)) * 100} 
                          text={formatTime(timeRemaining)}
                          styles={buildStyles({
                            textSize: '24px',
                            pathColor: timeRemaining < 5 * 60 ? '#ef4444' : timeRemaining < 10 * 60 ? '#f59e0b' : '#2563eb',
                            textColor: timeRemaining < 5 * 60 ? '#ef4444' : timeRemaining < 10 * 60 ? '#f59e0b' : '#2563eb',
                            trailColor: '#e5e7eb',
                          })}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">Remaining</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="text-xl font-bold flex items-center" style={{ color: wordCount < 150 ? '#f59e0b' : wordCount > 450 ? '#16a34a' : '#2563eb' }}>
                        {wordCount}
                      </div>
                      <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${Math.min(wordCount / 5, 100)}%`,
                            backgroundColor: wordCount < 150 ? '#f59e0b' : wordCount > 450 ? '#16a34a' : '#2563eb'
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">Words</span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className={`p-0 ${timerWarning && timeRemaining > 0 ? 'border-t border-amber-100 dark:border-amber-900/30' : ''}`}>
              {!timerActive && !essaySubmitted ? (
                <div className="flex flex-col items-center justify-center p-16 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Timer className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center space-y-2 max-w-md">
                    <h3 className="text-xl font-semibold">Ready to begin your essay?</h3>
                    <p className="text-muted-foreground">
                      Once you start writing, you'll have 30 minutes to complete your essay. The timer will begin immediately.
                    </p>
                  </div>
                  <Button onClick={handleStartEssay} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Timer className="mr-2 h-4 w-4" /> Begin Timed Essay
                  </Button>
                </div>
              ) : (
                <div className="min-h-[400px] border-b">
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-[400px]">
                      <div className="animate-pulse text-muted-foreground">Loading editor...</div>
                    </div>
                  }>
                    <div className="bg-white dark:bg-gray-950 min-h-[400px]">
                      <RichTextEditor
                        initialValue={essayContent}
                        onChange={setEssayContent}
                        placeholder="Start writing your essay here..."
                        readOnly={essaySubmitted}
                        minHeight="400px"
                      />
                    </div>
                  </Suspense>
                </div>
              )}
            </CardContent>
            
            {timerActive && !essaySubmitted && (
              <CardFooter className="flex justify-between py-4">
                <Button 
                  variant="outline" 
                  onClick={() => saveEssayMutation.mutate()} 
                  disabled={saveEssayMutation.isPending || !essayContent}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveEssayMutation.isPending ? 'Saving...' : 'Save Progress'}
                  {autoSaveIndicator && <span className="ml-1 text-xs text-green-600">✓</span>}
                </Button>
                <Button 
                  onClick={handleSubmitEssay} 
                  disabled={submitEssayMutation.isPending || wordCount < 150}
                  className={wordCount >= 150 ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitEssayMutation.isPending ? 'Submitting...' : 'Submit Essay'}
                </Button>
              </CardFooter>
            )}
            
            {essaySubmitted && (
              <CardFooter className="flex justify-center py-4">
                <Button onClick={() => setActiveTab('feedback')} className="bg-emerald-600 hover:bg-emerald-700">
                  <Lightbulb className="mr-2 h-4 w-4" /> View Your Feedback
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card className="bg-white dark:bg-gray-950 border border-blue-100 dark:border-blue-900 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-800 mb-2">
                    AI Analysis
                  </Badge>
                  <CardTitle className="text-xl">Essay Feedback & Evaluation</CardTitle>
                  <CardDescription>
                    Analysis based on the GRE analytical writing assessment criteria
                  </CardDescription>
                </div>
                <div className="bg-white dark:bg-gray-900 p-2 rounded-full shadow-sm">
                  <BrainCircuit className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8 pt-6">
              {submitEssayMutation.isPending ? (
                <div className="flex flex-col items-center justify-center p-16">
                  <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 animate-pulse">
                    <BrainCircuit className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Progress value={70} className="w-64 mb-4" />
                  <p className="text-center text-lg text-muted-foreground">
                    Analyzing your essay...
                  </p>
                  <p className="text-center text-sm text-muted-foreground max-w-md mt-2">
                    Our AI is evaluating your writing based on structure, clarity, reasoning, evidence, and language usage.
                  </p>
                </div>
              ) : submitEssayMutation.isSuccess && submitEssayMutation.data ? (
                <>
                  {/* Overall Score Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl overflow-hidden border border-blue-100 dark:border-blue-900/50">
                    <div className="flex flex-col md:flex-row items-stretch">
                      <div className="bg-blue-600 dark:bg-blue-700 text-white p-6 flex flex-col items-center justify-center md:w-1/4">
                        <h3 className="text-lg font-medium mb-1">Overall Score</h3>
                        <div className="text-5xl font-bold my-2">
                          {submitEssayMutation.data?.feedback?.overallScore || 3}
                        </div>
                        <div className="text-sm text-blue-100">out of 6</div>
                      </div>
                      
                      <div className="p-6 md:w-3/4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Award className="h-5 w-5 text-amber-500" /> Summary
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {submitEssayMutation.data?.feedback?.summary || 
                            "Your essay demonstrates a clear understanding of the task and presents relevant arguments. There's room for improvement in developing more nuanced analysis and providing stronger evidence."}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Evaluation Criteria */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-blue-600" /> Evaluation Criteria
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(submitEssayMutation.data?.feedback?.criteria || {}).map(([criterion, data]: [string, any]) => {
                        // Get appropriate colors based on score
                        const getScoreColor = (score: number) => {
                          if (score >= 4) return 'text-green-600 dark:text-green-400';
                          if (score >= 3) return 'text-blue-600 dark:text-blue-400';
                          return 'text-amber-600 dark:text-amber-400';
                        };
                        
                        const getBgColor = (score: number) => {
                          if (score >= 4) return 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50';
                          if (score >= 3) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50';
                          return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50';
                        };
                        
                        return (
                          <div key={criterion} className={`p-4 rounded-lg border ${getBgColor(data.score)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium capitalize flex items-center">
                                {getCriterionIcon(criterion)}
                                <span className="ml-2">{criterion}</span>
                              </h4>
                              <span className={`font-bold text-lg ${getScoreColor(data.score)}`}>
                                {data.score}/5
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${(data.score / 5) * 100}%`,
                                  backgroundColor: data.score >= 4 ? '#16a34a' : data.score >= 3 ? '#2563eb' : '#f59e0b'
                                }}
                              />
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {data.feedback}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Strengths & Areas for Improvement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-5">
                      <h3 className="text-lg font-medium mb-4 text-emerald-800 dark:text-emerald-300 flex items-center">
                        <CheckCircle2 className="mr-2 h-5 w-5" /> Strengths
                      </h3>
                      <ul className="space-y-3">
                        {(submitEssayMutation.data?.feedback?.strengths || [
                          "Clear thesis statement and main arguments",
                          "Logical organization of ideas",
                          "Good use of transitions between paragraphs"
                        ]).map((strength: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-emerald-500 mr-2 mt-1">•</span>
                            <span className="text-gray-800 dark:text-gray-200">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-5">
                      <h3 className="text-lg font-medium mb-4 text-amber-800 dark:text-amber-300 flex items-center">
                        <BarChart4 className="mr-2 h-5 w-5" /> Areas for Improvement
                      </h3>
                      <ul className="space-y-3">
                        {(submitEssayMutation.data?.feedback?.weaknesses || [
                          "Some arguments lack sufficient supporting evidence",
                          "Conclusion could more effectively summarize main points",
                          "Consider addressing counterarguments more thoroughly"
                        ]).map((weakness: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-amber-500 mr-2 mt-1">•</span>
                            <span className="text-gray-800 dark:text-gray-200">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Improvement Suggestions */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-5">
                    <h3 className="text-lg font-medium mb-4 text-blue-800 dark:text-blue-300 flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5" /> Suggestions for Improvement
                    </h3>
                    <div className="space-y-4">
                      {(submitEssayMutation.data?.feedback?.suggestions || [
                        "Develop more specific examples to support your key points",
                        "Consider a more nuanced thesis that acknowledges the complexity of the issue",
                        "Work on sentence variety to improve readability and flow"
                      ]).map((suggestion: string, idx: number) => (
                        <div key={idx} className="flex items-start bg-white dark:bg-gray-900 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                          <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full h-6 w-6 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                            <span>{idx + 1}</span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Next Steps */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30 p-5">
                    <h3 className="text-lg font-medium mb-3 text-purple-800 dark:text-purple-300 flex items-center">
                      <GraduationCap className="mr-2 h-5 w-5" /> Next Steps to Improve
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-purple-100 dark:border-purple-900/50">
                        <h4 className="font-medium mb-2">Practice More Essays</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Continue practicing with different prompts to build your analytical writing skills.
                        </p>
                        <Button variant="outline" onClick={handleBackToPrompts} size="sm">
                          Try Another Prompt
                        </Button>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-purple-100 dark:border-purple-900/50">
                        <h4 className="font-medium mb-2">Review Your Progress</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Check your essay history to see your improvement over time.
                        </p>
                        <Button variant="outline" onClick={() => setLocation('/essays/history')} size="sm">
                          View Essay History
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-12">
                  <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No feedback available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Submit your essay to receive detailed feedback and evaluation based on GRE scoring criteria.
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t border-blue-100 dark:border-blue-900/30 pt-6 pb-6">
              <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
                <Button variant="outline" onClick={handleBackToPrompts}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Essay Prompts
                </Button>
                <Button 
                  onClick={() => setLocation('/essays/history')} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <BarChart4 className="mr-2 h-4 w-4" /> View All Essays
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to get appropriate icon for each criterion
const getCriterionIcon = (criterion: string) => {
  switch (criterion) {
    case 'structure':
      return <LayoutGrid className="h-4 w-4 text-blue-600" />;
    case 'clarity':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'reasoning':
      return <BrainCircuit className="h-4 w-4 text-purple-600" />;
    case 'evidence':
      return <BookOpen className="h-4 w-4 text-amber-600" />;
    case 'grammar':
      return <PenLine className="h-4 w-4 text-red-600" />;
    default:
      return <Lightbulb className="h-4 w-4 text-blue-600" />;
  }
};

export default EssayWriting;