import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileEdit,
  Trash2,
  MoreVertical,
  Copy,
  Eye,
  AlertCircle,
  Clock,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PracticeSet {
  id: number;
  type: string;
  title: string;
  description: string;
  difficulty: number;
  questionIds: number[];
  isPublished?: boolean;
  timeLimit?: number | null;
  tags?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Fields for filtering and organization
  categoryFilter?: string | null;
  subtypeFilter?: string | null;
  topicFilter?: string | null;
  searchFilter?: string | null;
  randomizeQuestions?: boolean;
  passingScore?: number | null;
  // Fields for relating to topics
  relatedTopicId?: number | null;
  relatedTopicType?: string | null;
  showInTopic?: boolean;
}

interface PracticeSetTableProps {
  practiceSets: PracticeSet[];
  isLoading: boolean;
  onEdit: (practiceSet: PracticeSet) => void;
  onDelete: (practiceSet: PracticeSet) => void;
  onDuplicate: (practiceSet: PracticeSet) => void;
  isFiltering: boolean;
  onClearFilters: () => void;
}

const PracticeSetTable: React.FC<PracticeSetTableProps> = ({
  practiceSets,
  isLoading,
  onEdit,
  onDelete,
  onDuplicate,
  isFiltering,
  onClearFilters,
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = practiceSets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(practiceSets.length / itemsPerPage);
  
  // Pagination control functions
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToFirstPage = () => goToPage(1);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToLastPage = () => goToPage(totalPages);
  
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  // Helper function to format type as a badge
  const formatType = (type: string) => {
    let color;
    switch (type) {
      case "verbal":
        color = "text-emerald-600 bg-emerald-100 hover:bg-emerald-200";
        break;
      case "quantitative":
        color = "text-blue-600 bg-blue-100 hover:bg-blue-200";
        break;
      case "vocabulary":
        color = "text-purple-600 bg-purple-100 hover:bg-purple-200";
        break;
      default:
        color = "text-gray-600 bg-gray-100 hover:bg-gray-200";
    }

    return (
      <Badge variant="outline" className={`${color} font-normal capitalize`}>
        {type}
      </Badge>
    );
  };

  // Helper function to format difficulty as stars
  const formatDifficulty = (level: number) => {
    const stars = "★".repeat(level);
    return <span className="text-amber-500 font-medium">{stars}</span>;
  };

  // Helper function to format a date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render empty state
  if (practiceSets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">No Practice Sets</CardTitle>
          <CardDescription>
            {isFiltering
              ? "No practice sets match your current filters."
              : "You haven't created any practice sets yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {isFiltering ? (
            <Button variant="outline" onClick={onClearFilters}>
              <ListFilter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          ) : (
            <div className="text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">
                Create a new practice set to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render practice sets table
  return (
    <ScrollArea className="max-h-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Questions</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((set) => (
            <TableRow key={set.id}>
              <TableCell className="min-w-[220px]">
                <div className="font-medium">{set.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {set.description}
                </div>
                {set.timeLimit && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {set.timeLimit} min
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>{formatType(set.type)}</TableCell>
              <TableCell className="text-center">
                {set.questionIds?.length || 0}
              </TableCell>
              <TableCell>{formatDifficulty(set.difficulty)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(set.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onEdit(set)}
                      className="gap-2"
                    >
                      <FileEdit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDuplicate(set)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(set)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(indexOfLastItem, practiceSets.length)}
            </span> of{" "}
            <span className="font-medium">{practiceSets.length}</span> sets
          </p>
          
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-sm text-muted-foreground">Sets per page</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          
          <span className="text-sm font-medium mx-2">
            Page {currentPage} of {totalPages || 1}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToLastPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

export default PracticeSetTable;