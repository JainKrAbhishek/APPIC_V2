import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
// Import the enhanced rich text editor components
import { RichTextContent } from "@/lib/rich-text-editor";
// Keep the legacy editor import for backward compatibility
import { RichTextEditor } from "@/lib/RichTextEditor";
// Import the skeleton components for better loading states
import { ContentViewerSkeleton, TopicListSkeleton } from "@/components/ui/skeleton";

// Helper component for rendering content with math expressions
const MathContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Process the content to properly display KaTeX expressions
  const formattedContent = useMemo(() => {
    return content.replace(/\$(.*?)\$/g, (match, tex) => {
      // For inline math expressions
      return `<span class="math inline">${tex}</span>`;
    });
  }, [content]);
  
  return (
    <div 
      className="prose dark:prose-invert max-w-none" 
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};
import { QuantContent, QuantTopic, Question } from "@shared/schema";
import { 
  ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Info,
  BookOpen, BrainCircuit, Lightbulb, ArrowRight, Pencil, 
  Calculator, AlertCircle, ThumbsUp, TimerReset, History,
  CheckSquare, X, Check, Maximize
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { InlineMath, BlockMath } from 'react-katex';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import 'katex/dist/katex.min.css';

interface ContentViewerProps {
  topic: QuantTopic | undefined;
  content: QuantContent[] | undefined;
  isLoading: boolean;
  onMarkComplete: () => void;
  isCompleted: boolean;
  onGoBack: () => void;
  categoryColor: string;
  allTopics?: QuantTopic[] | undefined;
  onNavigateToTopic?: (topicId: number) => void;
  onStartPractice?: (topicId: number) => void;
}

interface Example {
  id: string;
  title: string;
  question: string;
  solution: string;
  explanation?: string;
}

interface Formula {
  id: string;
  title: string;
  formula: string;
  note?: string;
}

interface Definition {
  id: string;
  title: string;
  definition: string;
}

interface Tip {
  id: string;
  title: string;
  content: string;
}

interface ActiveElement {
  id: string;
  type: 'definition' | 'formula' | 'practice' | 'tip';
}

const ContentViewer = ({
  topic,
  content,
  isLoading,
  onMarkComplete,
  isCompleted,
  onGoBack,
  categoryColor,
  allTopics,
  onNavigateToTopic,
  onStartPractice
}: ContentViewerProps) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>("learn");
  
  // State for the active learning element
  const [activeElement, setActiveElement] = useState<ActiveElement | null>(null);
  
  // Track reading progress
  const [readingProgress, setReadingProgress] = useState<number>(0);
  
  // Practice mode state
  const [activeMode, setActiveMode] = useState<'list' | 'in-page'>('list');
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [practiceScore, setPracticeScore] = useState<{correct: number, total: number}>({ correct: 0, total: 0 });
  const [practiceCompleted, setPracticeCompleted] = useState<boolean>(false);
  
  // Ref for the content area
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Function to navigate to the next topic
  const navigateToNextTopic = () => {
    if (!allTopics || !topic || !onNavigateToTopic) return;
    
    const currentIndex = allTopics.findIndex(t => t.id === topic.id);
    if (currentIndex === -1 || currentIndex >= allTopics.length - 1) return;
    
    const nextTopic = allTopics[currentIndex + 1];
    onNavigateToTopic(nextTopic.id);
  };
  
  // Function to navigate to the previous topic
  const navigateToPrevTopic = () => {
    if (!allTopics || !topic || !onNavigateToTopic) return;
    
    const currentIndex = allTopics.findIndex(t => t.id === topic.id);
    if (currentIndex <= 0) return;
    
    const prevTopic = allTopics[currentIndex - 1];
    onNavigateToTopic(prevTopic.id);
  };
  
  // Update reading progress when scrolling
  useEffect(() => {
    const updateReadingProgress = () => {
      if (!contentRef.current) return;
      
      const contentEl = contentRef.current;
      const totalHeight = contentEl.scrollHeight - contentEl.clientHeight;
      const scrollPosition = contentEl.scrollTop;
      
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.round((scrollPosition / totalHeight) * 100));
        setReadingProgress(progress);
      }
    };
    
    const contentEl = contentRef.current;
    if (contentEl) {
      contentEl.addEventListener('scroll', updateReadingProgress);
      // Initial call to set progress
      updateReadingProgress();
      
      return () => {
        contentEl.removeEventListener('scroll', updateReadingProgress);
      };
    }
  }, [content, activeTab]);
  
  // Debug logs
  useEffect(() => {
    console.log("ContentViewer rendered with:", {
      hasTopic: !!topic,
      topicId: topic?.id,
      hasContent: !!content,
      contentLength: content?.length,
      isLoading,
      isCompleted
    });
    
    if (content) {
      console.log("Content array:", content);
    }
  }, [topic, content, isLoading, isCompleted]);
  
  // Determine if other related topics exist
  const relatedTopics = allTopics?.filter(t => 
    t.id !== topic?.id && 
    t.category === topic?.category
  ).slice(0, 3);

  // Format content for better readability using the enhanced RichTextContent component
  const formatContent = (item: QuantContent) => {
    try {
      // First check if content is already an array (parsed)
      if (Array.isArray(item.content)) {
        return <RichTextContent content={JSON.stringify(item.content)} className="prose dark:prose-invert max-w-none" />;
      }
      
      // If content is an object with a specific structure
      if (typeof item.content === 'object' && item.content !== null) {
        // Check if it has children property which is an array (Slate structure)
        const contentObj = item.content as {children?: unknown};
        if (contentObj.children && Array.isArray(contentObj.children)) {
          return <RichTextContent content={JSON.stringify([item.content])} className="prose dark:prose-invert max-w-none" />;
        }
        
        // It's some other kind of object, convert to string for display
        const prettyContent = JSON.stringify(item.content, null, 2);
        return (
          <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
            {prettyContent}
          </pre>
        );
      }
      
      // If it's a string, try to parse it as JSON
      if (typeof item.content === 'string') {
        // If the string is empty or very short, display it directly
        if (!item.content || item.content.length < 5) {
          return <div className="text-muted-foreground">No content available for this section.</div>;
        }
        
        // Check if it looks like JSON before trying to parse
        const trimmed = item.content.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
            (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            const parsedContent = JSON.parse(trimmed);
            
            // Handle array (Slate document)
            if (Array.isArray(parsedContent)) {
              return <RichTextContent content={trimmed} className="prose dark:prose-invert max-w-none" />;
            }
            
            // Handle object with children (single Slate element)
            const parsedObj = parsedContent as {children?: unknown};
            if (parsedContent && typeof parsedContent === 'object' && parsedObj.children && Array.isArray(parsedObj.children)) {
              return <RichTextContent content={JSON.stringify([parsedContent])} className="prose dark:prose-invert max-w-none" />;
            }
            
            // Otherwise just render as pretty JSON
            const prettyContent = JSON.stringify(parsedContent, null, 2);
            return (
              <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                {prettyContent}
              </pre>
            );
          } catch (parseErr) {
            // Try some sanitization techniques
            try {
              // Remove escape characters that might be causing issues
              const sanitized = item.content
                .replace(/\\"/g, '"')
                .replace(/\\n/g, '\n')
                .replace(/\\\\/g, '\\');
              
              // Check if it's a double-quoted JSON string
              if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
                // If it's wrapped in quotes, remove them and try again
                const unwrapped = sanitized.substring(1, sanitized.length - 1);
                try {
                  const reparsed = JSON.parse(unwrapped);
                  
                  // Handle array (Slate document)
                  if (Array.isArray(reparsed)) {
                    return <RichTextContent content={JSON.stringify(reparsed)} className="prose dark:prose-invert max-w-none" />;
                  }
                  
                  // Handle object with children (single Slate element)
                  const reparsedObj = reparsed as {children?: unknown};
                  if (reparsed && typeof reparsed === 'object' && reparsedObj.children && Array.isArray(reparsedObj.children)) {
                    return <RichTextContent content={JSON.stringify([reparsed])} className="prose dark:prose-invert max-w-none" />;
                  }
                } catch (e) {
                  // If all parsing attempts fail, render as text
                  return <div className="whitespace-pre-wrap text-sm">{item.content as string}</div>;
                }
              }
            } catch (e) {
              // If all parsing attempts fail, render as text
              return <div className="whitespace-pre-wrap text-sm">{item.content as string}</div>;
            }
          }
        }
        
        // If all parsing attempts fail, render as text
        return <div className="whitespace-pre-wrap text-sm">{item.content as string}</div>;
      }
      
      // Fallback for any other type
      return <div className="text-muted-foreground">Content format not supported.</div>;
    } catch (error) {
      console.error("Error rendering content:", error);
      return <div className="text-muted-foreground">Error displaying content.</div>;
    }
  };

  // Extract key practice problems, formulas, or definitions
  const extractLearningElements = () => {
    // This function would extract important elements from the content
    // For now, we'll simulate some practice problems
    
    // Sample formulas for integers
    const formulas = [
      { id: 'formula-1', title: 'Integer Addition', formula: 'a + b = b + a', note: 'The commutative property of addition' },
      { id: 'formula-2', title: 'Integer Multiplication', formula: 'a \\times b = b \\times a', note: 'The commutative property of multiplication' },
      { id: 'formula-3', title: 'Distributive Property', formula: 'a \\times (b + c) = a \\times b + a \\times c', note: 'Multiplication distributes over addition' }
    ];

    // Practice problems
    const practices = [
      { 
        id: 'practice-1', 
        title: 'Working with Negative Integers',
        question: 'Calculate: $(-3) \\times (-4) \\times (-5)$',
        solution: '$(-3) \\times (-4) \\times (-5) = 12 \\times (-5) = -60$',
        explanation: 'When multiplying negative numbers, two negatives make a positive, so $(-3) \\times (-4) = 12$. Then $12 \\times (-5) = -60$.'
      },
      {
        id: 'practice-2',
        title: 'Integer Division',
        question: 'Divide and determine the quotient and remainder: $17 ÷ 5$',
        solution: '$17 ÷ 5 = 3$ remainder $2$',
        explanation: 'The quotient is 3 (the number of times 5 goes into 17), and the remainder is 2 (what\'s left over).'
      },
      {
        id: 'practice-3',
        title: 'Integer Operations',
        question: 'Evaluate the expression: $8 - (-3) \\times 2 + 5$',
        solution: '$8 - (-3) \\times 2 + 5 = 8 - (-6) + 5 = 8 + 6 + 5 = 19$',
        explanation: 'Following order of operations, first multiply $(-3) \\times 2 = -6$, then work from left to right: $8 - (-6) = 8 + 6 = 14$, and finally $14 + 5 = 19$.'
      }
    ];
    
    // Sample definitions
    const definitions = [
      { id: 'def-1', title: 'Integer', definition: 'A member of the set of positive whole numbers, negative whole numbers, and zero.' },
      { id: 'def-2', title: 'Even Integer', definition: 'An integer that is divisible by 2 with no remainder.' },
      { id: 'def-3', title: 'Odd Integer', definition: 'An integer that is not divisible by 2 without a remainder.' }
    ];
    
    // Learning tips
    const tips = [
      { id: 'tip-1', title: 'Memorization Tip', content: 'Create a number line to visualize the relationships between integers and their operations.' },
      { id: 'tip-2', title: 'Exam Strategy', content: 'In GRE quantitative problems, always check if integer properties (like divisibility, odd/even) can simplify the problem.' }
    ];
    
    return { formulas, practices, definitions, tips };
  };
  
  const { formulas, practices, definitions, tips } = extractLearningElements();

  // Render loading state
  if (isLoading) {
    return (
      <Card className="h-full shadow-sm border border-gray-100 rounded-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-xl">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGoBack} 
              className="bg-white/80 border-gray-200 shadow-sm hover:bg-white hover:text-primary transition-all"
            >
              <ChevronLeft className="h-4 w-4 mr-1.5" />
              <span>Back</span>
            </Button>
          </div>
          <ContentViewerSkeleton />
        </CardHeader>
      </Card>
    );
  }

  // Render empty state if no topic is selected
  if (!topic) {
    return (
      <Card className="h-full shadow-sm border border-gray-100 rounded-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-xl">
          <CardTitle className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            GRE Content Library
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1.5">
            Select a topic to begin your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5 
            border border-primary/20 shadow-lg shadow-primary/5">
            <BrainCircuit className="h-8 w-8 text-primary animate-pulse-subtle" />
          </div>
          <p className="text-xl font-bold mb-3 text-gray-800">Ready to learn?</p>
          <p className="text-gray-600 mb-8 max-w-md">
            Select a topic from the sidebar to start learning quantitative concepts 
            and improve your GRE score with our comprehensive materials.
          </p>
          <Button 
            variant="outline" 
            onClick={onGoBack} 
            className="flex items-center gap-2 bg-white shadow-sm border-gray-200 
              hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
          >
            <ChevronLeft className="h-4 w-4" />
            View All Categories
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Display error if content should be available but isn't
  if (!content && !isLoading) {
    return (
      <Card className="h-full shadow-md border-0">
        <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={onGoBack} className="p-0 h-auto hover:bg-white/30 dark:hover:bg-white/10">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Back
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l-4 4M17 3l-4 4M19 6l-4 4M15 21l4-4M19 14l-4 4"></path>
              <circle cx="9" cy="13" r="3"></circle>
            </svg>
            <CardTitle className="text-lg sm:text-xl">{topic.name}</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">{topic.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 pb-8 sm:pb-12 px-4 sm:px-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error loading content</AlertTitle>
            <AlertDescription>
              Unable to load content for this topic. Please try refreshing the page or select another topic.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Display empty message if content array is empty
  if (content && content.length === 0) {
    return (
      <Card className="h-full shadow-md border-0">
        <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={onGoBack} className="p-0 h-auto hover:bg-white/30 dark:hover:bg-white/10">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Back
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l-4 4M17 3l-4 4M19 6l-4 4M15 21l4-4M19 14l-4 4"></path>
              <circle cx="9" cy="13" r="3"></circle>
            </svg>
            <CardTitle className="text-lg sm:text-xl">{topic.name}</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">{topic.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 pb-8 sm:pb-12 px-4 sm:px-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No content available</AlertTitle>
            <AlertDescription>
              This topic doesn't have any content available yet. Please check back later or select another topic.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render content when everything is loaded successfully
  return (
    <Card className="h-full shadow-md border-0 max-w-full w-full">
      <CardHeader className="border-b sticky top-0 z-10 px-3 py-2 sm:px-4 md:px-5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onGoBack} className="p-0 h-auto hover:bg-white/30 dark:hover:bg-white/10">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              <span className="text-xs sm:text-sm">Back</span>
            </Button>
            
            {/* Topic breadcrumb navigation */}
            {topic && topic.category && (
              <div className="hidden md:flex items-center text-xs text-slate-500 dark:text-slate-400 ml-2">
                <span>{topic.category}</span>
                <ChevronRight className="h-3 w-3 mx-1" />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{topic.name}</span>
              </div>
            )}
          </div>
          
          <Button
            variant={isCompleted ? "outline" : "default"}
            onClick={onMarkComplete}
            disabled={isCompleted}
            className={`gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto min-h-[32px] sm:min-h-[36px] ${isCompleted ? 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400' : ''}`}
            style={{ backgroundColor: isCompleted ? undefined : categoryColor }}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden xs:inline">Completed</span>
                <span className="xs:hidden">Done</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                <span className="hidden xs:inline">Mark as Complete</span>
                <span className="xs:hidden">Complete</span>
              </>
            )}
          </Button>
        </div>
        
        <div className="flex items-start flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-1 sm:mt-0 flex-shrink-0">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l-4 4M17 3l-4 4M19 6l-4 4M15 21l4-4M19 14l-4 4"></path>
              <circle cx="9" cy="13" r="3"></circle>
            </svg>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-xl leading-tight break-words">{topic.name}</CardTitle>
              <CardDescription className="mt-1 text-xs sm:text-sm font-medium opacity-90 break-words line-clamp-2">{topic.description}</CardDescription>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <History className="h-3 w-3" />
                <span>Reading progress: {readingProgress}%</span>
              </div>
              <Progress value={readingProgress} className="h-1 mt-1" />
            </div>
          </div>
          
          {/* Topic navigation controls */}
          <div className="flex items-center gap-1 self-end md:self-auto mt-2 md:mt-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToPrevTopic} 
              disabled={!allTopics || allTopics.findIndex(t => t.id === topic.id) <= 0}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="text-xs">Prev</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToNextTopic}
              disabled={!allTopics || allTopics.findIndex(t => t.id === topic.id) >= (allTopics.length - 1)}
              className="h-8 px-2"
            >
              <span className="text-xs">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* Tabs for different types of content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <TabsList className="flex h-10 bg-transparent p-0 w-full sm:w-auto rounded-none">
              <TabsTrigger 
                value="learn" 
                className="flex h-10 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 transition-all data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <BookOpen className="h-4 w-4" /> 
                <span>Learn</span>
              </TabsTrigger>
              <TabsTrigger 
                value="formulas" 
                className="flex h-10 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 transition-all data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <Calculator className="h-4 w-4" />
                <span>Formulas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="practice" 
                className="flex h-10 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 transition-all data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <Pencil className="h-4 w-4" />
                <span>Practice</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tips" 
                className="flex h-10 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 transition-all data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <Lightbulb className="h-4 w-4" />
                <span>Tips</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </CardHeader>
      
      <CardContent className="p-0 relative w-full" style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        <div 
          ref={contentRef}
          className="overflow-y-auto h-full w-full pb-8" 
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="learn">
            <TabsContent value="learn" className="pt-6 pb-8 px-4 sm:px-6 m-0">
              {content && content.length > 0 ? (
                <>
                  <div className="max-w-[1000px] lg:max-w-[1200px] mx-auto">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 mb-8">
                      <div className="flex items-center mb-2">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <h3 className="text-base font-medium text-blue-800 dark:text-blue-400">Learning Goals</h3>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                        By the end of this lesson, you should be able to:
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        <li className="flex items-baseline">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 mr-2 mt-1.5"></div>
                          <span className="text-slate-700 dark:text-slate-300">Understand what integers are and how they're represented</span>
                        </li>
                        <li className="flex items-baseline">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 mr-2 mt-1.5"></div>
                          <span className="text-slate-700 dark:text-slate-300">Learn the key properties of integer arithmetic</span>
                        </li>
                        <li className="flex items-baseline">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 mr-2 mt-1.5"></div>
                          <span className="text-slate-700 dark:text-slate-300">Apply integer concepts to solve GRE-style problems</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-10 max-w-[1000px] lg:max-w-[1200px] mx-auto">
                    {content.map((item, idx) => (
                      <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-md border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-medium">
                              {idx + 1}
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-400">{item.title}</h3>
                        </div>
                        <div className="rich-text-content rounded-lg p-1 overflow-x-auto leading-relaxed">
                          {formatContent(item)}
                        </div>
                        {idx === 0 && (
                          <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex items-center mb-2">
                              <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                              <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Key Concept</h4>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              Integers form the foundation of arithmetic and are essential for solving many GRE quantitative problems. 
                              Pay special attention to operations with negative integers and their properties.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-10 max-w-[1000px] lg:max-w-[1200px] mx-auto">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-5 border border-green-100 dark:border-green-900/30 shadow-md">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                        <h3 className="text-lg font-medium text-green-800 dark:text-green-400">Lesson Summary</h3>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                        In this lesson, you've learned about integers, their properties, and how they behave under various operations.
                        Remember that integers include both positive and negative whole numbers, as well as zero.
                      </p>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-green-200 dark:border-green-900/50">
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          Last updated: {new Date().toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant={isCompleted ? "outline" : "default"}
                            className={`${isCompleted ? 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            onClick={onMarkComplete}
                            disabled={isCompleted}
                            size="sm"
                          >
                            {isCompleted ? (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="h-4 w-4" />
                                <span>Completed</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="h-4 w-4" />
                                <span>Mark as Complete</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Related Topics Navigation */}
                  {relatedTopics && relatedTopics.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 max-w-[1000px] lg:max-w-[1200px] mx-auto">
                      <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        Related Topics
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {relatedTopics.map((relatedTopic) => (
                          <button 
                            key={relatedTopic.id}
                            onClick={() => onNavigateToTopic && onNavigateToTopic(relatedTopic.id)}
                            className="flex flex-col p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/70 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 text-left"
                          >
                            <span className="text-base font-medium text-slate-800 dark:text-slate-200 truncate">
                              {relatedTopic.name}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {relatedTopic.description}
                            </span>
                          </button>
                        ))}
                        
                        <button 
                          onClick={onGoBack}
                          className="flex items-center justify-center p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/70 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                        >
                          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                              <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"></path>
                              <path d="M12 2v8"></path>
                              <path d="M15.5 6.5 12 10 8.5 6.5"></path>
                            </svg>
                            View all topics
                          </span>
                        </button>
                      </div>
                      
                      {/* Topic Navigation */}
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={navigateToPrevTopic} 
                          disabled={!allTopics || allTopics.findIndex(t => t.id === topic.id) <= 0}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Previous Topic</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={navigateToNextTopic}
                          disabled={!allTopics || allTopics.findIndex(t => t.id === topic.id) >= (allTopics.length - 1)}
                          className="gap-1"
                        >
                          <span>Next Topic</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-3 sm:px-4 text-center">
                  <div className="inline-block p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 sm:mb-4">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">No content available</h3>
                  <p className="text-muted-foreground text-sm mb-2">This topic doesn't have any content yet.</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs sm:max-w-md mx-auto mb-4 sm:mb-6">
                    Content for this topic is being developed and will be available soon. Please check back later or explore other topics.
                  </p>
                  <Button variant="outline" size="sm" onClick={onGoBack} className="mt-2">
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Go back to topics
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="formulas" className="pt-6 pb-8 px-4 sm:px-6 m-0">
              {formulas && formulas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {formulas.map((formula) => (
                    <div key={formula.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-md border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow duration-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Calculator className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-medium mb-2 text-indigo-700 dark:text-indigo-400">{formula.title}</h3>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 rounded-md my-3 flex justify-center items-center min-h-[80px]">
                        <BlockMath math={formula.formula} />
                      </div>
                      {formula.note && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            <Info className="h-3 w-3 text-slate-400 inline-block mr-1" />
                            {formula.note}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-3 sm:px-4 text-center">
                  <div className="inline-block p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 sm:mb-4">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">No formulas available</h3>
                  <p className="text-muted-foreground text-sm mb-2">This topic doesn't have any formula content yet.</p>
                  <Button variant="outline" size="sm" onClick={onGoBack} className="mt-2">
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Go back to topics
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="practice" className="pt-6 pb-8 px-4 sm:px-6 m-0">
              {/* Practice mode toggle and navigation buttons */}
              {onStartPractice && topic && (
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <Button 
                      variant="ghost"
                      className={`rounded-md ${activeMode === 'list' ? '' : 'bg-white dark:bg-slate-700 shadow-sm'}`}
                      size="sm"
                      onClick={() => setActiveMode('in-page')}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"></path>
                          <circle cx="12" cy="12" r="4"></circle>
                        </svg>
                        <span>In-page Practice</span>
                      </div>
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => setActiveMode('list')}
                      size="sm"
                      className={`rounded-md ${activeMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                          <path d="M9 8h7"></path>
                          <path d="M8 12h6"></path>
                          <path d="M11 16h4"></path>
                        </svg>
                        <span>List View</span>
                      </div>
                    </Button>
                  </div>
                  <Button 
                    variant="secondary"
                    className="bg-blue-600 hover:bg-blue-700 text-white sm:w-auto w-full"
                    onClick={() => onStartPractice && onStartPractice(topic.id)}
                    size="sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M15 3v18"></path>
                        <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                        <path d="M21 13v4"></path>
                        <path d="M21 7v2"></path>
                      </svg>
                      <span>Go to Practice Page</span>
                    </div>
                  </Button>
                </div>
              )}
              
              {/* Practice problems - List View */}
              {activeMode === 'list' && practices && practices.length > 0 ? (
                <div className="space-y-6">
                  {practices.map((practice, index) => (
                    <div key={practice.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-md border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-medium">
                            {index + 1}
                          </div>
                        </div>
                        <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400">{practice.title}</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                          <div className="flex items-center mb-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">Problem</h4>
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300">
                            {practice.question.includes('$') ? (
                              <MathContentRenderer content={practice.question} />
                            ) : (
                              <RichTextContent 
                                content={JSON.stringify([{ 
                                  type: "paragraph", 
                                  children: [{ text: practice.question }] 
                                }])} 
                                className="prose dark:prose-invert max-w-none" 
                              />
                            )}
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50">
                          <div className="flex items-center mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                            <h4 className="text-sm font-medium text-green-700 dark:text-green-400">Solution</h4>
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300">
                            {practice.solution.includes('$') ? (
                              <MathContentRenderer content={practice.solution} />
                            ) : (
                              <RichTextContent 
                                content={JSON.stringify([{ 
                                  type: "paragraph", 
                                  children: [{ text: practice.solution }] 
                                }])} 
                                className="prose dark:prose-invert max-w-none" 
                              />
                            )}
                          </div>
                        </div>
                        {practice.explanation && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50">
                            <div className="flex items-center mb-2">
                              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
                              <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">Explanation</h4>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              {practice.explanation.includes('$') ? (
                                <MathContentRenderer content={practice.explanation} />
                              ) : (
                                <RichTextContent 
                                  content={JSON.stringify([{ 
                                    type: "paragraph", 
                                    children: [{ text: practice.explanation }] 
                                  }])} 
                                  className="prose dark:prose-invert max-w-none" 
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeMode === 'in-page' && practices && practices.length > 0 ? (
                // Interactive Practice Mode
                <div className="space-y-6">
                  {!practiceCompleted ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-md border border-slate-100 dark:border-slate-800">
                      {/* Practice Header with Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-medium">
                              {currentPracticeIndex + 1}
                            </div>
                          </div>
                          <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400">
                            {practices[currentPracticeIndex].title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="px-2.5 py-0.5">
                            {currentPracticeIndex + 1} of {practices.length}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => onStartPractice && onStartPractice(topic?.id)}
                            title="Open in full practice mode"
                          >
                            <Maximize className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Practice Content */}
                      <div className="space-y-4">
                        {/* Problem */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                          <div className="flex items-center mb-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">Problem</h4>
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300">
                            {practices[currentPracticeIndex].question.includes('$') ? (
                              <MathContentRenderer content={practices[currentPracticeIndex].question} />
                            ) : (
                              <RichTextContent 
                                content={JSON.stringify([{ 
                                  type: "paragraph", 
                                  children: [{ text: practices[currentPracticeIndex].question }] 
                                }])} 
                                className="prose dark:prose-invert max-w-none" 
                              />
                            )}
                          </div>
                        </div>
                        
                        {/* Answer Section */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center mb-3">
                            <CheckSquare className="h-4 w-4 text-slate-600 dark:text-slate-400 mr-2" />
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Your Answer</h4>
                          </div>
                          
                          {/* Simple answer options - typically these would be dynamic based on the problem */}
                          <RadioGroup 
                            value={userAnswers[practices[currentPracticeIndex].id] || ""} 
                            onValueChange={(value) => {
                              setUserAnswers({
                                ...userAnswers,
                                [practices[currentPracticeIndex].id]: value
                              });
                            }}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="-60" id="option-1" />
                              <Label htmlFor="option-1" className="text-sm">-60</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="60" id="option-2" />
                              <Label htmlFor="option-2" className="text-sm">60</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="0" id="option-3" />
                              <Label htmlFor="option-3" className="text-sm">0</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="-120" id="option-4" />
                              <Label htmlFor="option-4" className="text-sm">-120</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        {/* Show solution if requested */}
                        {showSolution[practices[currentPracticeIndex].id] && (
                          <>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50">
                              <div className="flex items-center mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                                <h4 className="text-sm font-medium text-green-700 dark:text-green-400">Solution</h4>
                              </div>
                              <div className="text-sm text-slate-700 dark:text-slate-300">
                                {practices[currentPracticeIndex].solution.includes('$') ? (
                                  <MathContentRenderer content={practices[currentPracticeIndex].solution} />
                                ) : (
                                  <RichTextContent 
                                    content={JSON.stringify([{ 
                                      type: "paragraph", 
                                      children: [{ text: practices[currentPracticeIndex].solution }] 
                                    }])} 
                                    className="prose dark:prose-invert max-w-none" 
                                  />
                                )}
                              </div>
                            </div>
                            
                            {practices[currentPracticeIndex].explanation && (
                              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50">
                                <div className="flex items-center mb-2">
                                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
                                  <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">Explanation</h4>
                                </div>
                                <div className="text-sm text-slate-700 dark:text-slate-300">
                                  {practices[currentPracticeIndex].explanation.includes('$') ? (
                                    <MathContentRenderer content={practices[currentPracticeIndex].explanation} />
                                  ) : (
                                    <RichTextContent 
                                      content={JSON.stringify([{ 
                                        type: "paragraph", 
                                        children: [{ text: practices[currentPracticeIndex].explanation }] 
                                      }])} 
                                      className="prose dark:prose-invert max-w-none" 
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Navigation */}
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (currentPracticeIndex > 0) {
                                setCurrentPracticeIndex(currentPracticeIndex - 1);
                              }
                            }}
                            disabled={currentPracticeIndex === 0}
                            className="flex items-center"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setShowSolution({
                                  ...showSolution,
                                  [practices[currentPracticeIndex].id]: !showSolution[practices[currentPracticeIndex].id]
                                });
                              }}
                            >
                              {showSolution[practices[currentPracticeIndex].id] ? 'Hide Solution' : 'Show Solution'}
                            </Button>
                            
                            {currentPracticeIndex === practices.length - 1 ? (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => {
                                  // Calculate score
                                  let correct = 0;
                                  practices.forEach(practice => {
                                    if (practice.id === 'practice-1' && userAnswers[practice.id] === '-60') {
                                      correct++;
                                    } else if (practice.id === 'practice-2' && userAnswers[practice.id] === '3 remainder 2') {
                                      correct++;
                                    } else if (practice.id === 'practice-3' && userAnswers[practice.id] === '19') {
                                      correct++;
                                    }
                                  });
                                  
                                  setPracticeScore({
                                    correct,
                                    total: practices.length
                                  });
                                  
                                  setPracticeCompleted(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Finish Practice
                              </Button>
                            ) : (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => {
                                  if (currentPracticeIndex < practices.length - 1) {
                                    setCurrentPracticeIndex(currentPracticeIndex + 1);
                                  }
                                }}
                                className="flex items-center"
                              >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Results screen
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-md border border-slate-100 dark:border-slate-800">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                          <CheckSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Practice Completed</h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          You scored {practiceScore.correct} out of {practiceScore.total}
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-between mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex-1 text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {Math.round((practiceScore.correct / practiceScore.total) * 100)}%
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Accuracy</div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex-1 text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {practiceScore.correct}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Correct</div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex-1 text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {practiceScore.total - practiceScore.correct}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Incorrect</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setCurrentPracticeIndex(0);
                            setPracticeCompleted(false);
                            setShowSolution({});
                          }}
                          className="flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M17 2l4 4-4 4"></path>
                            <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                            <path d="M7 22l-4-4 4-4"></path>
                            <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                          </svg>
                          Try Again
                        </Button>
                        
                        <Button 
                          variant="default" 
                          onClick={() => onStartPractice && onStartPractice(topic?.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M15 3v18"></path>
                            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                            <path d="M21 13v4"></path>
                            <path d="M21 7v2"></path>
                          </svg>
                          Full Practice Mode
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-3 sm:px-4 text-center">
                  <div className="inline-block p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 sm:mb-4">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">No practice problems available</h3>
                  <p className="text-muted-foreground text-sm mb-2">This topic doesn't have any practice problems yet.</p>
                  <Button variant="outline" size="sm" onClick={onGoBack} className="mt-2">
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Go back to topics
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tips" className="pt-6 pb-8 px-4 sm:px-6 m-0">
              {tips && tips.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30 mb-8">
                    <div className="flex items-center mb-3">
                      <BrainCircuit className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                      <h3 className="text-base font-medium text-amber-800 dark:text-amber-400">Study Tips for Integer Properties</h3>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                      Understanding integers thoroughly will help you solve many GRE Quantitative problems more efficiently. 
                      Here are some special tips for this topic.
                    </p>
                  </div>
                  
                  {tips.map((tip, index) => (
                    <div key={tip.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-md border border-amber-100 dark:border-amber-800/40 hover:shadow-lg transition-shadow duration-200">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 flex items-center justify-center">
                            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-amber-800 dark:text-amber-400 mb-2">{tip.title}</h3>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{tip.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-8 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl p-5 shadow-md border border-emerald-100 dark:border-emerald-800/40">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 flex items-center justify-center">
                          <ThumbsUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-emerald-800 dark:text-emerald-400 mb-2">Success Tip</h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          Focus on understanding the core concepts in this topic rather than memorizing formulas. The GRE tests your ability to apply integer properties to solve problems efficiently.
                        </p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-white/80 dark:bg-slate-800/80 rounded-md p-3 border border-emerald-100 dark:border-emerald-900/30">
                            <div className="flex items-center mb-1">
                              <TimerReset className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mr-1.5" />
                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-500">Time-saving Approach</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Look for patterns in the integers to quickly solve complex problems.
                            </p>
                          </div>
                          <div className="bg-white/80 dark:bg-slate-800/80 rounded-md p-3 border border-emerald-100 dark:border-emerald-900/30">
                            <div className="flex items-center mb-1">
                              <AlertCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mr-1.5" />
                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-500">Common Mistake</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Don't confuse integer properties with those of other number sets.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-3 sm:px-4 text-center">
                  <div className="inline-block p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 sm:mb-4">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">No tips available</h3>
                  <p className="text-muted-foreground text-sm mb-2">This topic doesn't have any study tips yet.</p>
                  <Button variant="outline" size="sm" onClick={onGoBack} className="mt-2">
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Go back to topics
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentViewer;