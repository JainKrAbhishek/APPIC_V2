import React from "react";
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Download, 
  UploadCloud, 
  Trash2, 
  X, 
  ListChecks, 
  AlertCircle, 
  RefreshCw 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WordFormValues } from "./types";
import { Word } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import components
import SearchFilters from "./SearchFilters";
import WordTable from "./WordTable";
import WordForm from "./WordForm";
import VocabularyBulkActions from "./VocabularyBulkActions";

// Import hooks
import { 
  useVocabularyManagement, 
  useWordForm, 
  useVocabularyImport, 
  useWordDeletion,
  ITEMS_PER_PAGE
} from "./hooks";

interface VocabularyManagerProps {
  searchTerm?: string;
}

const VocabularyManager: React.FC<VocabularyManagerProps> = ({ searchTerm = "" }) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Use custom hooks with enhanced error handling
  const {
    vocabularyData,
    loadingVocabulary,
    isVocabularyError,
    vocabularyError,
    refetchVocabulary,
    filterDay,
    isFiltering,
    selectedWords,
    selectAll,
    currentPage,
    filteredWords,
    paginatedWords,
    totalPages,
    toggleSelectAll,
    toggleWordSelection,
    handleSearchChange,
    handleFilterDayChange,
    clearFilters,
    setCurrentPage,
    setSelectedWords,
    setSelectAll
  } = useVocabularyManagement();

  const {
    importStatus,
    seedVocabularyMutation
  } = useVocabularyImport();

  const {
    handleDelete,
    handleBulkDelete,
    bulkDeleteInProgress
  } = useWordDeletion();

  const {
    wordForm,
    editingItem,
    setEditingItem,
    onSubmitWord,
    resetForm,
    isSubmitting
  } = useWordForm(() => {
    setDialogOpen(false);
  });

  // Handle adding new word - memoized to prevent recreation
  const handleAddNew = React.useCallback(() => {
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  }, [setEditingItem, resetForm, setDialogOpen]);

  // Handle editing word - memoized to prevent recreation
  const handleEdit = React.useCallback((word: Word) => {
    setEditingItem(word);
    resetForm({
      word: word.word,
      definition: word.definition,
      example: word.example,
      pronunciation: word.pronunciation || "",
      day: word.day,
      order: word.order,
    });
    setDialogOpen(true);
  }, [setEditingItem, resetForm, setDialogOpen]);

  // Handle bulk delete - memoized to prevent recreation
  const handleBulkDeleteClick = React.useCallback(async () => {
    const success = await handleBulkDelete(selectedWords);
    if (success) {
      setSelectedWords([]);
      setSelectAll(false);
    }
  }, [handleBulkDelete, selectedWords, setSelectedWords, setSelectAll]);

  // Get statistics - memoized to prevent recalculation
  const totalWords = React.useMemo(() => vocabularyData?.length || 0, [vocabularyData]);
  const uniqueDays = React.useMemo(
    () => new Set(vocabularyData?.map(word => word.day)).size,
    [vocabularyData]
  );

  return (
    <div className="w-full">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Vocabulary Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Add, edit and organize GRE vocabulary words
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-gray-600 border-gray-300"
            onClick={React.useCallback(() => window.open('/api/export-vocabulary-csv', '_blank'), [])}
          >
            <Download className="h-4 w-4" />
            <span>Export to CSV</span>
          </Button>
          
          <Button 
            onClick={handleAddNew}
            className="h-9 gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Add Word</span>
          </Button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Words</p>
                <h3 className="text-2xl font-bold mt-1">{totalWords}</h3>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Days Count</p>
                <h3 className="text-2xl font-bold mt-1">{uniqueDays}</h3>
              </div>
              <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <ListChecks className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Selected</p>
                <h3 className="text-2xl font-bold mt-1">{selectedWords.length}</h3>
              </div>
              <div className="h-10 w-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Card */}
      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        <CardHeader className="px-6 pt-6 pb-4 border-b">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            Word Management
          </CardTitle>
          <CardDescription>
            Search, filter, and manage vocabulary words for GRE preparation
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Search and Filters */}
          <div className="p-6 border-b bg-gray-50/50">
            <SearchFilters
              searchTerm={searchTerm || ""}
              onSearchChange={handleSearchChange}
              filterDay={filterDay}
              onFilterDayChange={handleFilterDayChange}
              isFiltering={isFiltering}
              onClearFilters={clearFilters}
            />
          </div>
          
          {/* Bulk Actions */}
          {selectedWords.length > 0 && (
            <div className="mx-6 mt-6 flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3 sm:mb-0">
                <Badge className="bg-primary border-0">
                  {selectedWords.length} words selected
                </Badge>
                <span className="text-sm text-gray-600">Bulk actions available</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                  onClick={handleBulkDeleteClick}
                  disabled={bulkDeleteInProgress}
                >
                  {bulkDeleteInProgress ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent mr-2"></div>
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  <span>Delete Selected</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={React.useCallback(() => {
                    setSelectedWords([]);
                    setSelectAll(false);
                  }, [setSelectedWords, setSelectAll])}
                >
                  <X className="h-4 w-4 mr-2" />
                  <span>Clear Selection</span>
                </Button>
              </div>
            </div>
          )}
          
          {/* Words Table with Error Handling */}
          <div className="p-6">
            {isVocabularyError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-red-100 p-3 text-red-600 mb-3">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load vocabulary data</h3>
                <p className="text-sm text-gray-500 max-w-md mb-4">
                  {vocabularyError instanceof Error 
                    ? vocabularyError.message 
                    : "There was an error loading the vocabulary data. Please try again."}
                </p>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => refetchVocabulary()}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry</span>
                </Button>
              </div>
            ) : (
              <WordTable
                words={paginatedWords}
                isLoading={loadingVocabulary}
                selectedWords={selectedWords}
                onToggleSelection={toggleWordSelection}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSelectAll={toggleSelectAll}
                selectAll={selectAll}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Word Form Dialog */}
      <WordForm
        isOpen={dialogOpen}
        onClose={React.useCallback(() => setDialogOpen(false), [setDialogOpen])}
        onSubmit={onSubmitWord}
        defaultValues={wordForm.getValues()}
        isEditing={!!editingItem}
      />
    </div>
  );
};

export default VocabularyManager;