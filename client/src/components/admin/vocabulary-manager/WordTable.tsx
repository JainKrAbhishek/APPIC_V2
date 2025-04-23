import React, { useState, useCallback, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Edit, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  MoreHorizontal,
  ExternalLink,
  Info,
  X,
  AlignJustify
} from "lucide-react";
import { WordTableProps } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WordTable: React.FC<WordTableProps> = ({
  words,
  isLoading,
  selectedWords,
  onToggleSelection,
  onEdit,
  onDelete,
  onSelectAll,
  selectAll,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage
}) => {
  // State for mobile detail view
  const [activeWordDetail, setActiveWordDetail] = useState<number | null>(null);
  
  // Memoized function to toggle word detail sheet
  const toggleWordDetail = useCallback((wordId: number | null) => {
    setActiveWordDetail(wordId);
  }, []);
  
  // Empty state component
  const EmptyState = (
    <div className="flex flex-col items-center py-12 px-4">
      <Search className="h-12 w-12 text-gray-300 mb-3" />
      <span className="text-lg text-gray-600 font-medium">No Results Found</span>
      <p className="text-sm text-gray-500 mt-2 max-w-md text-center">
        Try changing your search or filters, or add a new word
      </p>
    </div>
  );
  
  // Loading state component with enhanced skeleton UI and animations
  const LoadingState = (
    <div className="w-full animate-pulse-gentle">
      <TableSkeleton 
        rows={5} 
        columns={5} 
        showHeader={true} 
        withCheckbox={true}
        className="border-gray-100"
      />
      <div className="flex items-center justify-center mt-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
  
  // Find the active word for the detail view
  const activeWord = activeWordDetail !== null ? words.find(w => w.id === activeWordDetail) : null;
  
  return (
    <>
      {/* Desktop table view - hide on small screens */}
      <div className="rounded-lg border border-gray-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-50 border-b">
              <TableRow>
                <TableHead className="w-[50px] py-3 px-4">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all words"
                  />
                </TableHead>
                <TableHead className="w-[60px] py-3">ID</TableHead>
                <TableHead className="py-3">Word</TableHead>
                <TableHead className="py-3">Definition & Example</TableHead>
                <TableHead className="w-[80px] text-center py-3">Day</TableHead>
                <TableHead className="w-[80px] text-center py-3">Order</TableHead>
                <TableHead className="w-[90px] text-right py-3 px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    {LoadingState}
                  </TableCell>
                </TableRow>
              ) : words.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    {EmptyState}
                  </TableCell>
                </TableRow>
              ) : (
                words.map(word => (
                  <TableRow key={word.id} className="group hover:bg-gray-50">
                    <TableCell className="py-3 px-4">
                      <Checkbox
                        checked={selectedWords.includes(word.id)}
                        onCheckedChange={() => onToggleSelection(word.id)}
                        aria-label={`Select ${word.word}`}
                      />
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs py-3">
                      {word.id}
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <div className="font-medium text-gray-900">{word.word}</div>
                        {word.pronunciation && (
                          <div className="text-xs text-gray-500 mt-1">
                            {word.pronunciation}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="max-w-[400px]">
                        <div className="text-sm line-clamp-2">
                          {word.definition}
                        </div>
                        {word.example && (
                          <div className="text-xs text-gray-500 mt-1.5 italic line-clamp-1">
                            "{word.example.replace(/<\/?u>/g, '')}"
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Day {word.day}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs text-gray-500 py-3">
                      {word.order}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex justify-end items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-600 hover:text-primary hover:bg-primary/10"
                                onClick={() => onEdit(word)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="text-xs">Edit word</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              className="text-destructive hover:text-destructive focus:text-destructive"
                              onClick={() => onDelete(word.id, word.word)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span>Delete Word</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Mobile card view - only show on small screens */}
      <div className="md:hidden">
        {isLoading ? (
          LoadingState
        ) : words.length === 0 ? (
          EmptyState
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {words.map(word => (
              <Card key={word.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedWords.includes(word.id)}
                        onCheckedChange={() => onToggleSelection(word.id)}
                        aria-label={`Select ${word.word}`}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{word.word}</h3>
                        {word.pronunciation && (
                          <p className="text-xs text-gray-500">{word.pronunciation}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Day {word.day}
                      </Badge>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 ml-1"
                        onClick={() => toggleWordDetail(word.id)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 text-sm line-clamp-2 text-gray-700">
                    {word.definition}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 p-3 bg-gray-50">
                    <div className="text-xs text-gray-500">
                      ID: {word.id} • Order: {word.order}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-primary hover:bg-primary/10"
                        onClick={() => onEdit(word)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        <span>Edit</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(word.id, word.word)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Word detail sheet for mobile */}
      <Sheet open={activeWordDetail !== null} onOpenChange={(open) => !open && setActiveWordDetail(null)}>
        <SheetContent side="bottom" className="h-[80vh]">
          {activeWord && (
            <>
              <SheetHeader className="text-left mb-4">
                <SheetTitle className="flex items-center justify-between">
                  <span className="text-xl">{activeWord.word}</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Day {activeWord.day}
                  </Badge>
                </SheetTitle>
                {activeWord.pronunciation && (
                  <SheetDescription className="text-gray-500">
                    {activeWord.pronunciation}
                  </SheetDescription>
                )}
              </SheetHeader>
              
              <ScrollArea className="h-[calc(80vh-140px)]">
                <div className="space-y-4 pb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Definition</h3>
                    <p className="text-base">{activeWord.definition}</p>
                  </div>
                  
                  {activeWord.example && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Example</h3>
                      <p className="text-base italic">"{activeWord.example.replace(/<\/?u>/g, '')}"</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="border border-gray-200 rounded-md p-3">
                      <span className="text-xs text-gray-500 block mb-1">ID</span>
                      <span className="font-medium">{activeWord.id}</span>
                    </div>
                    <div className="border border-gray-200 rounded-md p-3">
                      <span className="text-xs text-gray-500 block mb-1">Order</span>
                      <span className="font-medium">{activeWord.order}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              <div className="flex justify-end mt-4 pt-4 border-t gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => toggleWordDetail(null)}
                >
                  <X className="h-4 w-4" />
                  <span>Close</span>
                </Button>
                <Button
                  variant="default"
                  className="gap-2"
                  onClick={() => {
                    onEdit(activeWord);
                    toggleWordDetail(null);
                  }}
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Word</span>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-6 border-t pt-4 gap-4">
          <div className="text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
            Showing <span className="font-medium">{words.length}</span> of <span className="font-medium">{itemsPerPage * totalPages}</span> results
          </div>
          
          <Pagination className="order-1 sm:order-2">
            <PaginationContent className="flex flex-wrap justify-center gap-1">
              {/* Previous button */}
              <PaginationItem className="hidden sm:inline-flex">
                <PaginationPrevious 
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))} 
                  className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} h-9 px-2.5 border-gray-200 hover:bg-gray-50`}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>Previous</span>
                </PaginationPrevious>
              </PaginationItem>
              
              {/* Mobile simplified page counter */}
              <div className="sm:hidden flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </span>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Desktop page numbers */}
              <div className="hidden sm:flex">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, i, array) => {
                    // Add ellipsis
                    if (i > 0 && page > array[i - 1] + 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => onPageChange(page)}
                          className={`cursor-pointer h-9 min-w-9 border ${page === currentPage 
                            ? 'bg-primary/10 border-primary/20 text-primary font-medium' 
                            : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })
                }
              </div>
              
              {/* Next button */}
              <PaginationItem className="hidden sm:inline-flex">
                <PaginationNext 
                  onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} 
                  className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} h-9 px-2.5 border-gray-200 hover:bg-gray-50`}
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4 ml-2" />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};

export default WordTable;