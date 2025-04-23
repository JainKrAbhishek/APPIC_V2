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
import { QuantTopic } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface TopicsListProps {
  topics: QuantTopic[];
  isLoading: boolean;
  onEditTopic: (topic: QuantTopic) => void;
  onDeleteTopic: (topicId: number) => void;
  onSelectTopic: (topicId: number) => void;
  selectedTopicId: number | null;
}

const TopicsList: React.FC<TopicsListProps> = ({
  topics,
  isLoading,
  onEditTopic,
  onDeleteTopic,
  onSelectTopic,
  selectedTopicId,
}) => {
  // State to track expanded topics
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

  const toggleTopic = (topicId: number) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Group topics by category
  const groupedTopics: { [key: string]: QuantTopic[] } = {};
  topics.forEach(topic => {
    if (!groupedTopics[topic.category]) {
      groupedTopics[topic.category] = [];
    }
    groupedTopics[topic.category].push(topic);
  });

  // Sort topics within each category by order
  Object.values(groupedTopics).forEach(topicGroup => {
    topicGroup.sort((a, b) => a.order - b.order);
  });

  return (
    <ScrollArea className="h-[500px] rounded-md border p-2">
      {Object.entries(groupedTopics).map(([category, topicsInCategory]) => (
        <div key={category} className="mb-2">
          {/* Category header */}
          <div 
            className={cn(
              "flex items-center py-2 px-2 rounded-md cursor-pointer hover:bg-muted/50",
              expandedTopics.has(topicsInCategory[0].id) ? "bg-muted/30" : "" // Corrected condition
            )}
            onClick={() => toggleTopic(topicsInCategory[0].id)} // Corrected argument
          >
            {expandedTopics.has(topicsInCategory[0].id) ? ( // Corrected condition
              <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            <Folder className="h-4 w-4 mr-2 text-blue-500" />
            <span className="font-medium">{category}</span>
          </div>

          {/* Topics within category */}
          {expandedTopics.has(topicsInCategory[0].id) && ( // Corrected condition
            <div className="ml-6 space-y-1 mt-1">
              {topicsInCategory.map((topic) => (
                <div
                  key={topic.id}
                  className={cn(
                    "flex items-center py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/50 group",
                    selectedTopicId === topic.id ? "bg-muted/60" : ""
                  )}
                  onClick={() => onSelectTopic(topic.id)}
                >
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="flex-1 truncate">{topic.name}</span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEditTopic(topic);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
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
  );
};

export default TopicsList;