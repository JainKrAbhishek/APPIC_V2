import { CheckCircle2, Search, BookOpen, Lock, ArrowRight, CheckCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { QuantTopic } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TopicListProps {
  title: string;
  description: string;
  topics: QuantTopic[] | undefined;
  isLoading: boolean;
  selectedTopicId: number | null;
  userProgress: Record<number, boolean>;
  onTopicSelect: (topicId: number) => void;
}

const TopicList = ({
  title,
  description,
  topics,
  isLoading,
  selectedTopicId,
  userProgress,
  onTopicSelect
}: TopicListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredTopics = topics?.filter(topic => 
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchQuery.toLowerCase() || "")
  );
  
  // Calculate completion stats
  const completedCount = topics?.filter(topic => userProgress[topic.id])?.length || 0;
  const totalCount = topics?.length || 0;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  if (isLoading) {
    return (
      <Card className="h-full shadow-md border-0">
        <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="text-sm font-medium opacity-90">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-sm">Loading topics...</p>
        </CardContent>
      </Card>
    );
  }

  // Function to check if a topic is unlocked
  const isTopicUnlocked = (index: number, topic: QuantTopic) => {
    // First topic is always unlocked
    if (index === 0) return true;
    
    // If previous topic is completed, then this topic is unlocked
    if (topics && index > 0) {
      const previousTopic = topics[index - 1];
      return previousTopic && userProgress[previousTopic.id];
    }
    return false;
  };

  return (
    <Card className="h-full shadow-md border-0">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              {title}
              {completedCount > 0 && (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                  {completionPercentage}% Complete
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium mt-1 opacity-90">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-6 pt-3">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search topics..."
            className="w-full pl-8 pr-3 py-2 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <ScrollArea className="h-[250px] xs:h-[300px] sm:h-[400px] pr-2 sm:pr-3">
          <div className="space-y-1 sm:space-y-1.5 px-1 sm:px-2">
            {filteredTopics && filteredTopics.length > 0 ? (
              filteredTopics.map((topic, index) => {
                const isCompleted = userProgress[topic.id];
                const isUnlocked = isTopicUnlocked(index, topic);
                const isSelected = selectedTopicId === topic.id;
                
                return (
                  <TooltipProvider key={topic.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isSelected ? "default" : "ghost"}
                          className={`w-full justify-start group relative pl-4 text-2xs xs:text-xs sm:text-sm py-1.5 xs:py-2 sm:py-3 h-auto min-h-[2rem] xs:min-h-[2.25rem] sm:min-h-[2.5rem] mb-1 ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : isUnlocked 
                                ? 'hover:bg-slate-100 dark:hover:bg-slate-800' 
                                : 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-not-allowed'
                          }`}
                          onClick={() => isUnlocked && onTopicSelect(topic.id)}
                          disabled={!isUnlocked}
                        >
                          <div className="absolute left-1.5 xs:left-2 top-1/2 -translate-y-1/2">
                            {isCompleted ? (
                              <div className="flex items-center justify-center w-3 h-3 xs:w-4 xs:h-4 rounded-full bg-green-100 dark:bg-green-900">
                                <CheckCircle2 className="h-2 w-2 xs:h-3 xs:w-3 text-green-600 dark:text-green-400" />
                              </div>
                            ) : isUnlocked ? (
                              <div className={`h-1.5 w-1.5 xs:h-2 xs:w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                            ) : (
                              <div className="flex items-center justify-center w-3 h-3 xs:w-4 xs:h-4 text-slate-400">
                                <Lock className="h-2 w-2 xs:h-3 xs:w-3" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center w-full">
                            <span className="flex-1 text-left truncate font-medium">{topic.name}</span>
                            {isCompleted ? (
                              <Badge variant="outline" className="ml-1 border-green-400 text-green-600 dark:text-green-400 text-2xs">
                                <CheckCheck className="h-2.5 w-2.5 mr-0.5" />
                                Done
                              </Badge>
                            ) : isUnlocked ? (
                              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-60" />
                            ) : (
                              <Badge variant="outline" className="ml-1 text-2xs">Locked</Badge>
                            )}
                          </div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {!isUnlocked ? (
                          <p>Complete previous topic to unlock</p>
                        ) : isCompleted ? (
                          <p>Topic completed. Click to review.</p>
                        ) : (
                          <p>Click to start this topic</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })
            ) : (
              <div className="text-center py-6 xs:py-8 px-2">
                <div className="inline-flex h-8 w-8 xs:h-10 xs:w-10 items-center justify-center rounded-full bg-muted mb-2 xs:mb-3">
                  <Search className="h-3 w-3 xs:h-4 xs:w-4 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-xs xs:text-sm">
                  {searchQuery
                    ? `No topics found matching "${searchQuery}"`
                    : "No topics available"}
                </p>
                {searchQuery && (
                  <Button 
                    variant="link" 
                    className="text-2xs xs:text-xs mt-1 h-auto p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <style dangerouslySetInnerHTML={{
          __html: `
          /* Custom text size for very small screens */
          @media (max-width: 360px) {
            .text-2xs {
              font-size: 0.65rem;
              line-height: 1rem;
            }
          }
          `
        }} />
        
        {topics && topics.length > 0 && (
          <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center">
              <div className="h-2 w-2 bg-primary rounded-full mr-2"></div>
              <span>{topics.length} Topics</span>
            </span>
            <span>{completedCount} of {totalCount} completed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopicList;