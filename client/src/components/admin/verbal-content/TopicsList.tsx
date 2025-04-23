import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VerbalTopic } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TopicsListProps {
  topics?: VerbalTopic[];
  isLoading: boolean;
  onEditTopic: (topic: VerbalTopic) => void;
  onDeleteTopic: (id: number) => void;
  onSelectTopic: (topicId: number) => void;
  selectedTopicId: number | null;
  availableTypes?: string[];
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
  isDeletingTopic?: boolean;
}

export const TopicsList: React.FC<TopicsListProps> = ({
  topics = [],
  isLoading,
  onEditTopic,
  onDeleteTopic,
  onSelectTopic,
  selectedTopicId,
  availableTypes = [],
  selectedType,
  onSelectType,
  isDeletingTopic,
}) => {
  // State to track expanded topics
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  // Format type name for display
  const formatTypeName = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Group topics by type
  const groupedTopics: { [key: string]: VerbalTopic[] } = {};
  topics.forEach(topic => {
    if (!groupedTopics[topic.type]) {
      groupedTopics[topic.type] = [];
    }
    groupedTopics[topic.type].push(topic);
  });

  // Sort topics within each type by order
  Object.values(groupedTopics).forEach(topicGroup => {
    topicGroup.sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2 mt-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topics.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Topics Available</h3>
            <p className="text-muted-foreground text-sm">
              Start by creating a new topic for your verbal content.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Topics</CardTitle>
          <Select
            value={selectedType || "all"}
            onValueChange={(value) => onSelectType(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {formatTypeName(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {Object.entries(groupedTopics).map(([type, topicsInType]) => (
            <div key={type} className="mb-4">
              {/* Type header */}
              <div 
                className={cn(
                  "flex items-center py-2 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                  expandedTypes.has(type) ? "bg-muted/30" : ""
                )}
                onClick={() => toggleType(type)}
              >
                {expandedTypes.has(type) ? (
                  <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                {expandedTypes.has(type) ? (
                  <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                )}
                <span className="font-medium">{formatTypeName(type)}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({topicsInType.length})
                </span>
              </div>

              {/* Topics within type */}
              {expandedTypes.has(type) && (
                <div className="ml-6 space-y-1 mt-1">
                  {topicsInType.map((topic) => (
                    <div
                      key={topic.id}
                      className={cn(
                        "flex items-center py-2 px-2 rounded-md cursor-pointer transition-colors",
                        "hover:bg-muted/50 group relative",
                        selectedTopicId === topic.id ? "bg-muted/60" : ""
                      )}
                      onClick={() => onSelectTopic(topic.id)}
                    >
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{topic.title}</div>
                        {topic.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {topic.description}
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                            disabled={isDeletingTopic}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onEditTopic(topic);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTopic(topic.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TopicsList;