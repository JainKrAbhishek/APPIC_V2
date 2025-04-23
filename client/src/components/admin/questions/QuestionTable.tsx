import React from "react";
import { Question } from "@shared/schema";
import { FileEdit, Trash2, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuestionTableProps {
  questions: Question[];
  isLoading: boolean;
  onEdit: (question: Question) => void;
  onDelete: (id: number) => void;
  onView: (question: Question) => void;
}

const QuestionTable: React.FC<QuestionTableProps> = ({
  questions,
  isLoading,
  onEdit,
  onDelete,
  onView,
}) => {
  // Function to truncate content for display
  const truncateContent = (content: any): string => {
    if (typeof content === 'string') {
      return content.length > 100 ? `${content.substring(0, 100)}...` : content;
    } else if (content && typeof content === 'object') {
      if ('text' in content) {
        const text = content.text as string;
        return text.length > 100 ? `${text.substring(0, 100)}...` : text;
      } else {
        const jsonStr = JSON.stringify(content);
        return jsonStr.length > 100 ? `${jsonStr.substring(0, 100)}...` : jsonStr;
      }
    }
    return 'No content';
  };

  // Function to get badge color based on question type
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'quantitative':
        return 'bg-blue-100 text-blue-800';
      case 'verbal':
        return 'bg-purple-100 text-purple-800';
      case 'vocabulary':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get difficulty badge color
  const getDifficultyBadgeColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-lime-100 text-lime-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      case 4:
        return 'bg-orange-100 text-orange-800';
      case 5:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">ID</TableHead>
            <TableHead>Content</TableHead>
            <TableHead className="w-[110px]">Type</TableHead>
            <TableHead className="w-[100px]">Subtype</TableHead>
            <TableHead className="w-[100px]">Category</TableHead>
            <TableHead className="w-[100px]">Difficulty</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                Loading questions...
              </TableCell>
            </TableRow>
          ) : questions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                No questions found. Add your first question.
              </TableCell>
            </TableRow>
          ) : (
            questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>{question.id}</TableCell>
                <TableCell>
                  <div className="max-w-md">
                    {truncateContent(question.content)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeBadgeColor(question.type as string)} variant="outline">
                    {question.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {question.subtype}
                  </Badge>
                </TableCell>
                <TableCell>
                  {question.category}
                </TableCell>
                <TableCell>
                  <Badge className={getDifficultyBadgeColor(question.difficulty as number)} variant="outline">
                    {question.difficulty}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onView(question)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Question</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(question)}>
                            <FileEdit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Question</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(question.id as number)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Question</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuestionTable;