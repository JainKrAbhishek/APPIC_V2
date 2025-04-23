import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { VerbalTopic, VerbalContent } from '@shared/schema';
import { RichTextEditor } from '@/lib/RichTextEditor';
import { Spinner, ContentLoader, SkeletonCard, SkeletonText } from '@/components/ui/spinner';
import { 
  ArrowLeft, 
  CheckCircle, 
  BookOpen, 
  Clock, 
  ListChecks, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  BookMarked,
  CircleCheck,
  Brain,
  FileText
} from 'lucide-react';
import { CompletionConfetti } from '@/components/CompletionConfetti';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ContentViewerProps {
  topic: VerbalTopic | undefined;
  content: VerbalContent[] | undefined;
  isLoading: boolean;
  onMarkComplete: () => void;
  isCompleted: boolean;
  onGoBack: () => void;
}

const ContentViewer: React.FC<ContentViewerProps> = ({
  topic,
  content,
  isLoading,
  onMarkComplete,
  isCompleted,
  onGoBack
}) => {
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [readTime, setReadTime] = useState('');
  
  // Reset content index when topic changes
  useEffect(() => {
    setCurrentContentIndex(0);
    setBookmarked(false);
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

  // Map verbal type to icon
  const getVerbalTypeIcon = () => {
    if (!topic) return <BookOpen />;
    
    switch (topic.type?.toLowerCase()) {
      case 'reading_comprehension':
        return <FileText />;
      case 'critical_reasoning':
        return <Brain />;
      case 'text_completion':
        return <ListChecks />;
      case 'sentence_equivalence':
        return <CircleCheck />;
      default:
        return <BookOpen />;
    }
  };

  // Map verbal type to a color scheme
  const getTypeColorScheme = () => {
    if (!topic) return {
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      accent: 'text-blue-600 dark:text-blue-400',
      progress: 'bg-blue-500'
    };
    
    switch (topic.type?.toLowerCase()) {
      case 'reading_comprehension':
        return {
          gradient: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20',
          accent: 'text-violet-600 dark:text-violet-400',
          progress: 'bg-violet-500'
        };
      case 'critical_reasoning':
        return {
          gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
          accent: 'text-emerald-600 dark:text-emerald-400',
          progress: 'bg-emerald-500'
        };
      case 'text_completion':
        return {
          gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
          accent: 'text-amber-600 dark:text-amber-400',
          progress: 'bg-amber-500'
        };
      case 'sentence_equivalence':
        return {
          gradient: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20',
          accent: 'text-rose-600 dark:text-rose-400',
          progress: 'bg-rose-500'
        };
      default:
        return {
          gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
          accent: 'text-blue-600 dark:text-blue-400',
          progress: 'bg-blue-500'
        };
    }
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
  const colors = getTypeColorScheme();
  const typeIcon = getVerbalTypeIcon();

  return (
    <>
      <CompletionConfetti show={showConfetti} />
      
      <Card className="w-full shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <CardHeader className={`bg-gradient-to-r ${colors.gradient} rounded-t-lg pb-4`}>
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${colors.accent} bg-white/80 dark:bg-slate-800/50`}>
                {typeIcon}
              </div>
              <div>
                <CardTitle className="text-xl font-semibold flex items-center">
                  {topic.title}
                  {isCompleted && (
                    <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription className="mt-1 text-sm opacity-90">{topic.description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onGoBack} className="mt-[-4px] bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="mt-5 flex items-center">
            <div className="flex-1 h-2 bg-white/30 dark:bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${colors.progress}`}
                style={{ width: `${((currentContentIndex + 1) / content.length) * 100}%` }}
              ></div>
            </div>
            <Badge variant="secondary" className="ml-3 bg-white/50 dark:bg-slate-800/50 text-sm font-medium">
              {currentContentIndex + 1} / {content.length}
            </Badge>
          </div>
        </CardHeader>
        
        <div className="flex items-center px-6 py-2 bg-muted/20 border-y border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              <span>{readTime} read</span>
            </div>
            <div className="flex items-center">
              <ListChecks className="h-3.5 w-3.5 mr-1.5" />
              <span>{content.length} sections</span>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="px-2 h-5 text-[10px]">
                {topic.type?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={toggleBookmark}
                  >
                    {bookmarked ? (
                      <BookMarked className="h-4 w-4 text-primary" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
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
        
        <CardContent className="pt-6 pb-4">
          <div className="mb-3 text-xl font-semibold flex items-center">
            <span>{currentContent.title}</span>
            <Badge variant="outline" className="ml-3 text-xs">Section {currentContentIndex + 1}</Badge>
          </div>
          <Separator className="mb-5 mt-2" />
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
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2 pb-5 px-6 border-t border-slate-200 dark:border-slate-700 bg-muted/10">
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
                className={`gap-2 ${isCompleted ? "border-green-500 text-green-500" : ""}`}
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
                className="gap-2"
                size="lg"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default ContentViewer;