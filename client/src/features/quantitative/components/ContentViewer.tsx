import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QuantTopic, QuantContent } from '@shared/schema';
import { RichTextEditor } from '@/lib/RichTextEditor';
import { Spinner, ContentLoader, SkeletonCard, SkeletonText } from '@/components/ui/spinner';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  BookOpen, 
  Clock, 
  ListChecks, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  BookMarked,
  ExternalLink,
  Dumbbell,
  MoveRight,
  BookText,
  Video,
  Play,
  Lightbulb
} from 'lucide-react';
import { CompletionConfetti } from '@/components/CompletionConfetti';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

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
}

const ContentViewer: React.FC<ContentViewerProps> = ({
  topic,
  content,
  isLoading,
  onMarkComplete,
  isCompleted,
  onGoBack,
  categoryColor,
  allTopics,
  onNavigateToTopic
}) => {
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [readTime, setReadTime] = useState('');
  
  // Reset content index when topic changes
  useEffect(() => {
    setCurrentContentIndex(0);
    setBookmarked(false);
    setNotes('');
    setShowNotes(false);
  }, [topic?.id]);

  // Calculate estimated read time for current content
  useEffect(() => {
    if (!content || content.length === 0) return;
    
    const currentContent = content[currentContentIndex];
    if (currentContent) {
      // Calculate based on content length (simple estimation)
      let contentString = '';
      try {
        if (typeof currentContent.content === 'string') {
          const parsed = JSON.parse(currentContent.content);
          contentString = JSON.stringify(parsed);
        } else {
          contentString = JSON.stringify(currentContent.content);
        }
      } catch (error) {
        contentString = String(currentContent.content);
      }
      
      // Rough estimate: 200 words per minute reading speed
      const wordCount = contentString.split(/\s+/).length;
      const minutes = Math.max(1, Math.round(wordCount / 200));
      setReadTime(`${minutes} min${minutes !== 1 ? 's' : ''}`);
    }
  }, [content, currentContentIndex]);

  const handleNextContent = () => {
    if (content && currentContentIndex < content.length - 1) {
      setCurrentContentIndex(prevIndex => prevIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(prevIndex => prevIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMarkComplete = () => {
    setShowConfetti(true);
    onMarkComplete();
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    // In a real implementation, this would save to the user's profile
  };

  const toggleNotes = () => {
    setShowNotes(!showNotes);
  };

  if (isLoading) {
    return (
      <Card className="w-full h-full min-h-[500px] shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="pt-8 px-4">
          <SkeletonCard className="rounded-t-lg mb-4" />
          <SkeletonText rows={2} className="w-3/4 mb-4" />
          <Separator className="my-4" />
          <SkeletonText rows={6} className="mb-4" />
          <SkeletonText rows={1} lastRowWidth="60%" />
        </div>
      </Card>
    );
  }

  if (!topic || !content || content.length === 0) {
    return (
      <Card className="w-full h-full min-h-[500px] shadow-lg border border-slate-200 dark:border-slate-700">
        <CardContent className="flex flex-col items-center justify-center h-full py-16">
          <div className="h-16 w-16 rounded-full bg-muted/70 flex items-center justify-center mb-6">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No Content Available</h3>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            There's no content available for this topic yet. Please select another topic or check back later.
          </p>
          <Button size="lg" onClick={onGoBack} className="px-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back to Topics
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentContent = content[currentContentIndex];
  const isLastContent = currentContentIndex === content.length - 1;

  // Determine background color based on category
  const getBgGradient = () => {
    switch (categoryColor) {
      case 'blue':
        return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
      case 'green':
        return 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20';
      case 'purple':
        return 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20';
      case 'amber':
        return 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20';
      default:
        return 'from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800';
    }
  };

  // Determine accent color for icons
  const getAccentColor = () => {
    switch (categoryColor) {
      case 'blue': return 'text-blue-600 dark:text-blue-400';
      case 'green': return 'text-emerald-600 dark:text-emerald-400';
      case 'purple': return 'text-purple-600 dark:text-purple-400';
      case 'amber': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-primary';
    }
  };

  return (
    <>
      <CompletionConfetti show={showConfetti} />
      
      <div className="max-w-4xl mx-auto">
        {/* Topic header - Khan Academy style */}
        <div className="bg-sky-50 dark:bg-slate-800 py-6 px-8 border-b border-slate-200 dark:border-slate-700">
          <div className="mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onGoBack} 
              className="text-sky-700 dark:text-sky-300 -ml-2 mb-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${getAccentColor()} bg-white dark:bg-slate-800/90`}>
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {topic.name}
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                      <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      Completed
                    </Badge>
                  )}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{topic.description}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center">
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-blue-500 dark:bg-blue-600"
                style={{ width: `${((currentContentIndex + 1) / content.length) * 100}%` }}
              ></div>
            </div>
            <Badge variant="outline" className="ml-3 bg-white dark:bg-slate-800 text-sm font-medium">
              {currentContentIndex + 1} / {content.length}
            </Badge>
          </div>
        </div>
        
        {/* Content title bar */}
        <div className="flex items-center justify-between py-3 px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {currentContentIndex + 1}. {currentContent.title}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1.5" />
              <span>{readTime} read</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-0 h-8 w-8"
                    onClick={toggleBookmark}
                  >
                    {bookmarked ? (
                      <BookMarked className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{bookmarked ? 'Remove bookmark' : 'Bookmark this content'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-white dark:bg-slate-900 px-8 py-6">
          <div className="prose dark:prose-invert max-w-none">
            <RichTextEditor 
              initialValue={
                typeof currentContent.content === 'string' 
                  ? JSON.parse(currentContent.content) 
                  : currentContent.content
              } 
              readOnly={true}
            />
          </div>
        </div>
        
        {/* Navigation and action buttons - Khan Academy style */}
        <div className="bg-white dark:bg-slate-900 px-8 py-5 border-t border-slate-200 dark:border-slate-700">
          {/* Action buttons for navigation */}
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="outline" 
              onClick={handlePreviousContent}
              disabled={currentContentIndex === 0}
              className="gap-2"
              size="lg"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex gap-3">
              {isLastContent && (
                <Button 
                  onClick={handleMarkComplete} 
                  disabled={isCompleted}
                  variant={isCompleted ? "outline" : "default"}
                  className={`gap-2 ${isCompleted ? "border-green-500 text-green-500" : "bg-blue-600 hover:bg-blue-700"}`}
                  size="lg"
                >
                  {isCompleted ? (
                    <>
                      <Award className="h-4 w-4" />
                      Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              )}
              
              {!isLastContent && (
                <Button 
                  onClick={handleNextContent} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Additional actions */}
          {isLastContent && (
            <div className="mt-10 border-t border-slate-200 dark:border-slate-700 pt-6">
              <h4 className="text-lg font-medium mb-4">Topic actions</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-0 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 sm:p-0">
                  <Button 
                    variant="outline"
                    className="gap-3 h-auto py-4 border-blue-200 dark:border-blue-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                      <Dumbbell className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">Practice exercises</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Test your knowledge</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="gap-3 h-auto py-4 border-purple-200 dark:border-purple-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-md"
                  >
                    <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
                      <Video className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">Video tutorial</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Visual explanation</span>
                    </div>
                  </Button>
                </div>
                
                {isCompleted && allTopics && onNavigateToTopic && (
                  <Button 
                    variant="outline"
                    className="gap-3 h-auto py-4 border-green-200 dark:border-green-800 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                    onClick={() => {
                      // Find the current topic index in allTopics
                      const currentTopicIndex = allTopics.findIndex(t => t.id === topic.id);
                      // Navigate to the next topic if available
                      if (currentTopicIndex >= 0 && currentTopicIndex < allTopics.length - 1) {
                        onNavigateToTopic(allTopics[currentTopicIndex + 1].id);
                      }
                    }}
                  >
                    <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                      <MoveRight className="h-5 w-5 text-green-500 dark:text-green-400" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">Next topic</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Continue your learning path</span>
                    </div>
                  </Button>
                )}
                
                {/* If practice button is all we have, make it full width */}
                {(!isCompleted || !allTopics || !onNavigateToTopic) && (
                  <Button 
                    variant="outline"
                    className="gap-3 h-auto py-4 border-slate-200 dark:border-slate-700"
                    onClick={onGoBack}
                  >
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                      <ArrowLeft className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">Return to topics</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Browse all available topics</span>
                    </div>
                  </Button>
                )}
              </div>
              
              {/* Progress indicator */}
              {allTopics && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Topic progress</span>
                    <span>
                      {allTopics.findIndex(t => t.id === topic.id) + 1} of {allTopics.length} topics
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-blue-500 dark:bg-blue-600"
                      style={{ width: `${((allTopics.findIndex(t => t.id === topic.id) + 1) / allTopics.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ContentViewer;