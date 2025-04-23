import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuantTopic, QuantContent } from '@shared/schema';
import { ContentViewerProps } from './types';
import { PencilIcon, FolderIcon, FileTextIcon } from 'lucide-react';
import { RichTextContent } from '@/lib/rich-text-editor';

/**
 * SimpleContentViewer
 * Displays content in a clean, easy-to-read format
 */
const SimpleContentViewer: React.FC<ContentViewerProps> = ({
  content,
  topic,
  loading,
  onEdit
}) => {
  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-[400px]">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (!topic && !content) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
          <FileTextIcon className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Content Selected</h3>
          <p className="text-slate-500 max-w-md">
            Select a topic or content item from the list to view details, or create a new one
            using the buttons in the content library.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center text-xs font-medium text-slate-500 mb-1">
              {topic && (
                <>
                  <FolderIcon className="h-3.5 w-3.5 mr-1" />
                  <span className="uppercase tracking-wide">{topic.category}</span>
                  <span className="mx-2">•</span>
                </>
              )}
              <span>Group {topic?.groupNumber || "?"}</span>
            </div>
            <CardTitle>
              {content ? content.title : topic?.name}
            </CardTitle>
            {topic && !content && (
              <CardDescription className="mt-1">
                {topic.description}
              </CardDescription>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="ml-4"
            onClick={onEdit}
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            <span>Edit</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {content ? (
          <ScrollArea className="h-[450px]">
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <RichTextContent
                content={
                  typeof content.content === 'string' 
                    ? content.content 
                    : JSON.stringify(content.content)
                } 
                className="prose dark:prose-invert max-w-none"
              />
            </div>
          </ScrollArea>
        ) : topic ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Topic Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="col-span-1">
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-medium">{topic.category}</dd>
                </div>
                <div className="col-span-1">
                  <dt className="text-slate-500">Group Number</dt>
                  <dd className="font-medium">{topic.groupNumber}</dd>
                </div>
                <div className="col-span-1">
                  <dt className="text-slate-500">Display Order</dt>
                  <dd className="font-medium">{topic.order}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded">
                {topic.description}
              </div>
            </div>
            
            {/* Don't display anything if no actual content is present */}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default SimpleContentViewer;