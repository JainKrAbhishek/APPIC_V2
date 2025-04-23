import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  CheckSquare, 
  Square,
  Filter
} from "lucide-react";

import { Content, getContentTitle, getContentDescription } from "./types";

interface ContentSelectionTableProps {
  contentList: Content[];
  isLoading: boolean;
  selectedContent: Content[];
  onContentSelect: (content: Content) => void;
  onSelectAll: () => void;
  emptyFilteredMessage?: string;
}

const ContentSelectionTable: React.FC<ContentSelectionTableProps> = ({
  contentList,
  isLoading,
  selectedContent,
  onContentSelect,
  onSelectAll,
  emptyFilteredMessage = "No content found matching your filters."
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!contentList || contentList.length === 0) {
    return (
      <div className="text-center p-6 border rounded-md bg-muted/20">
        <Filter className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <h3 className="font-medium text-lg mb-2">No Content Found</h3>
        <p className="text-muted-foreground mb-4">
          {emptyFilteredMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  selectedContent.length > 0 &&
                  selectedContent.length === contentList.length
                }
                onCheckedChange={onSelectAll}
                aria-label="Select all content"
              />
            </TableHead>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Content</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="w-[100px] text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contentList.map((content) => (
            <TableRow 
              key={content.id} 
              onClick={() => onContentSelect(content)}
              className="cursor-pointer"
            >
              <TableCell>
                <Checkbox
                  checked={selectedContent.some(c => c.id === content.id)}
                  onCheckedChange={() => onContentSelect(content)}
                  aria-label={`Select content ${content.id}`}
                />
              </TableCell>
              <TableCell>
                <Badge variant="outline">{content.id}</Badge>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  {getContentTitle(content)}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {getContentDescription(content)}
              </TableCell>
              <TableCell className="text-center">
                {selectedContent.some(c => c.id === content.id) ? (
                  <CheckSquare className="h-5 w-5 text-primary mx-auto" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground mx-auto" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContentSelectionTable;