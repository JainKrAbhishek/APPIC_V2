import { CheckCircle2, Search, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { QuantTopic } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TopicItem {
  id: number;
  name: string;
  description?: string;
  order?: number;
  category?: string;
  // Optional fields to comply with QuantTopic interface
  groupNumber?: number;
  icon?: string | null;
  prerequisites?: string | null;
}

interface TopicListProps {
  title: string;
  description: string;
  topics: TopicItem[] | undefined;
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

  return (
    <Card className="h-full shadow-sm border border-gray-100 rounded-xl bg-white/70 backdrop-blur-sm">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-xl border-b border-primary/10">
        <div className="flex items-center space-x-3">
          <div className="bg-white shadow-sm rounded-lg p-2 border border-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {title}
              {completedCount > 0 && (
                <Badge 
                  variant="outline" 
                  className="ml-2 bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm px-2.5 py-0.5"
                >
                  {completionPercentage}% Complete
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium mt-1.5 text-gray-600">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-6 pt-3">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-primary/60" />
          <Input
            type="text"
            placeholder="Search topics..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border-gray-200 shadow-sm 
              rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/30 
              transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <ScrollArea className="h-[250px] xs:h-[300px] sm:h-[400px] pr-2 sm:pr-3">
          <div className="space-y-1 sm:space-y-1.5 px-1 sm:px-2">
            {filteredTopics && filteredTopics.length > 0 ? (
              filteredTopics.map((topic) => (
                <Button
                  key={topic.id}
                  variant={selectedTopicId === topic.id ? "default" : "outline"}
                  className={`w-full justify-start group relative pl-9 text-xs sm:text-sm py-2.5 
                    h-auto min-h-[2.5rem] sm:min-h-[2.75rem] mb-2 rounded-lg transition-all duration-200
                    border ${selectedTopicId === topic.id ? 'border-primary/50' : 'border-gray-200'}
                    ${
                      selectedTopicId === topic.id 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-primary/30 hover:text-primary'
                    }`}
                  onClick={() => onTopicSelect(topic.id)}
                >
                  <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center 
                    w-5 h-5 rounded-full transition-all ${
                      selectedTopicId === topic.id ? 'bg-white/20' : 'bg-primary/10'
                    }`}
                  >
                    {userProgress[topic.id] ? (
                      <CheckCircle2 className={`h-3.5 w-3.5 ${
                        selectedTopicId === topic.id ? 'text-white' : 'text-emerald-500'
                      }`} />
                    ) : (
                      <div className={`h-2 w-2 rounded-full ${
                        selectedTopicId === topic.id ? 'bg-white' : 'bg-primary/40'
                      }`}></div>
                    )}
                  </div>
                  <div className="flex items-center w-full">
                    <span className={`flex-1 text-left truncate font-medium ${
                      userProgress[topic.id] && selectedTopicId !== topic.id ? 'text-emerald-600' : ''
                    }`}>{topic.name}</span>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50/50 rounded-lg border border-gray-100 shadow-sm">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full 
                  bg-white border border-gray-200 shadow-sm mb-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium text-sm mb-2">
                  {searchQuery
                    ? `No topics found matching "${searchQuery}"`
                    : "No topics available"}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-xs mt-2 py-1.5 px-3 h-auto bg-white shadow-sm border-gray-200
                      hover:bg-gray-50 hover:border-gray-300"
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
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="flex items-center bg-white px-2.5 py-1.5 rounded-full text-xs font-medium text-gray-600 shadow-sm border border-gray-100">
              <div className="h-2 w-2 bg-primary rounded-full mr-2"></div>
              <span>{topics.length} Topics</span>
            </span>
            <span className="bg-white px-2.5 py-1.5 rounded-full text-xs font-medium shadow-sm border border-gray-100">
              <span className={`${completedCount > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                {completedCount}
              </span> 
              <span className="text-gray-500"> of {totalCount} completed</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopicList;