import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { QuantTopic, QuantContent } from '@shared/schema';
import { ContentListProps } from './types';
import { 
  ChevronRightIcon, 
  FolderIcon, 
  FileTextIcon, 
  PlusIcon 
} from 'lucide-react';

/**
 * Simplified content list component for quantitative content
 * Displays topics and content in an easy-to-navigate list
 */
const SimpleContentList: React.FC<ContentListProps> = ({
  topics,
  contents,
  selectedTopicId,
  selectedContentId,
  loading,
  onSelectTopic,
  onSelectContent,
  onCreateTopic,
  onCreateContent
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex justify-between items-center">
          <span>Content Library</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onCreateTopic}
            className="h-8"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            <span>New Topic</span>
          </Button>
        </CardTitle>
        <CardDescription>
          Browse quantitative topics and content
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {loading && !topics.length ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="space-y-1">
            {topics.map((topic) => (
              <div key={topic.id} className="space-y-1">
                <Button
                  variant={selectedTopicId === topic.id ? "default" : "ghost"}
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => {
                    // Toggle topic selection - if already selected, deselect it
                    if (selectedTopicId === topic.id) {
                      onSelectTopic(0); // Use 0 or null to indicate no selection
                    } else {
                      onSelectTopic(topic.id);
                    }
                  }}
                >
                  <FolderIcon className="h-4 w-4 mr-2 shrink-0" />
                  <div className="truncate">{topic.name}</div>
                  <ChevronRightIcon 
                    className={`h-4 w-4 ml-auto transition-transform ${selectedTopicId === topic.id ? 'rotate-90' : ''}`} 
                  />
                </Button>
                
                {selectedTopicId === topic.id && (
                  <div className="ml-4 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                    {loading && !contents.length ? (
                      <div className="py-2 flex justify-center">
                        <Spinner size="sm" />
                      </div>
                    ) : contents.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-slate-500">
                        No content available
                      </div>
                    ) : (
                      contents.map((content) => (
                        <Button
                          key={content.id}
                          variant={selectedContentId === content.id ? "secondary" : "ghost"}
                          className="w-full justify-start text-left h-auto py-1.5 text-sm"
                          onClick={() => onSelectContent(content.id)}
                        >
                          <FileTextIcon className="h-3.5 w-3.5 mr-2 shrink-0" />
                          <div className="truncate">{content.title}</div>
                        </Button>
                      ))
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left mt-1 text-primary"
                      onClick={onCreateContent}
                      disabled={!selectedTopicId}
                    >
                      <PlusIcon className="h-3.5 w-3.5 mr-2" />
                      <span>Add content</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {!loading && topics.length === 0 && (
              <div className="py-8 text-center text-slate-500">
                <div className="mb-2">No topics available</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onCreateTopic}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create your first topic
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {topics.length > 0 && (
        <CardFooter className="pt-4 pb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onCreateContent}
            disabled={!selectedTopicId}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            New Content
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SimpleContentList;