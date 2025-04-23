import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent,
  DialogDescription, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Loader2 } from "lucide-react";

import PracticeSetTable from "./PracticeSetTable";
import FilterBar from "./FilterBar";
import NewPracticeSetForm from "./NewPracticeSetForm";
import ImportExportButtons from "./ImportExportButtons";

// Interface definitions
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
  categoryFilter?: string | null;
  subtypeFilter?: string | null;
  topicFilter?: string | null;
  searchFilter?: string | null;
  randomizeQuestions?: boolean;
  passingScore?: number | null;
  relatedTopicId?: number | null;
  relatedTopicType?: string | null;
  showInTopic?: boolean;
}

interface Question {
  id: number;
  type: string;
  subtype: string;
  content: any;
  options: any[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: number;
  tags: string[];
  typeId?: number;
  category?: string | null;
  topic?: string | null;
  imageUrls?: string[] | null;
}

const NewPracticeSetManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for managing practice sets
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPracticeSet, setEditingPracticeSet] = useState<PracticeSet | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [practiceSetToDelete, setPracticeSetToDelete] = useState<PracticeSet | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  
  // State for filtering and searching
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch practice sets
  const {
    data: practiceSets = [],
    isLoading: isLoadingPracticeSets,
    isError: isPracticeSetsError,
    refetch: refetchPracticeSets,
  } = useQuery<PracticeSet[]>({
    queryKey: ["/api/practice-sets"],
    queryFn: async () => {
      const response = await fetch("/api/practice-sets");
      if (!response.ok) {
        throw new Error("Failed to fetch practice sets");
      }
      return response.json();
    }
  });

  // Fetch questions
  const {
    data: questions = [],
    isLoading: isLoadingQuestions,
  } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const response = await fetch("/api/questions");
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      return response.json();
    }
  });

  // Mutations for CRUD operations
  const createMutation = useMutation({
    mutationFn: async (data: Omit<PracticeSet, "id">) => {
      return apiRequest<PracticeSet>("/api/practice-sets", { method: "POST", data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-sets"] });
      toast({
        title: "Success",
        description: "Practice set created successfully",
      });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      console.error("Error creating practice set:", error);
      toast({
        title: "Error",
        description: "Failed to create practice set. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PracticeSet) => {
      return apiRequest<PracticeSet>(`/api/practice-sets/${data.id}`, { method: "PUT", data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-sets"] });
      toast({
        title: "Success",
        description: "Practice set updated successfully",
      });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      console.error("Error updating practice set:", error);
      toast({
        title: "Error",
        description: "Failed to update practice set. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/practice-sets/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-sets"] });
      toast({
        title: "Success",
        description: "Practice set deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setPracticeSetToDelete(null);
    },
    onError: (error: any) => {
      console.error("Error deleting practice set:", error);
      toast({
        title: "Error",
        description: "Failed to delete practice set. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleFormSubmit = (data: any) => {
    if (editingPracticeSet) {
      updateMutation.mutate({ ...data, id: editingPracticeSet.id });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit button click
  const handleEdit = (practiceSet: PracticeSet) => {
    setEditingPracticeSet(practiceSet);
    setIsFormOpen(true);
  };

  // Handle delete button click
  const handleDelete = (practiceSet: PracticeSet) => {
    setPracticeSetToDelete(practiceSet);
    setIsDeleteDialogOpen(true);
  };

  // Handle duplicate button click
  const handleDuplicate = (practiceSet: PracticeSet) => {
    // Create a new object without the id field
    const { id, ...rest } = practiceSet;
    const duplicatedSet = {
      ...rest,
      title: `Copy of ${practiceSet.title}`,
    };
    createMutation.mutate(duplicatedSet);
  };

  // Handle confirming deletion
  const confirmDelete = () => {
    if (practiceSetToDelete) {
      deleteMutation.mutate(practiceSetToDelete.id);
    }
  };

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPracticeSet(null);
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter(null);
    setDifficultyFilter(null);
    setSortOption("newest");
  };
  
  // Handle exporting practice sets
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Create a copy of the data to prepare for export
      const exportData = practiceSets.map(set => {
        // Create a clean copy without any internal fields
        return {
          ...set
        };
      });
      
      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `practice-sets-export-${new Date().toISOString().split('T')[0]}.json`;
      
      // Append link to the body
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `Successfully exported ${exportData.length} practice sets.`,
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting practice sets.",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle importing practice sets
  const handleImport = async (importData: any) => {
    try {
      if (!Array.isArray(importData)) {
        throw new Error("Imported data must be an array of practice sets");
      }
      
      // Process imported sets one by one
      let successCount = 0;
      
      // Create a copy and process in sequence
      for (const set of importData) {
        try {
          // Make sure to remove id to create new entries
          const { id, ...practiceSetData } = set;
          
          // Call the create mutation instead of mutateAsync
          await new Promise<void>((resolve, reject) => {
            createMutation.mutate(practiceSetData, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err)
            });
          });
          successCount++;
        } catch (error) {
          console.error("Error importing practice set:", error);
          // Continue with the next item even if one fails
        }
      }
      
      // Update the UI with success message
      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} of ${importData.length} practice sets.`,
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("Import error:", error);
      return Promise.reject(error);
    }
  };

  // Calculate the number of active filters
  const activeFiltersCount = 
    (search ? 1 : 0) + 
    (typeFilter ? 1 : 0) + 
    (difficultyFilter ? 1 : 0) + 
    (sortOption !== "newest" ? 1 : 0);

  // Filter and sort practice sets
  const filteredPracticeSets = React.useMemo(() => {
    let filtered = [...practiceSets];

    // Filter by tab OR type filter, but not both (tab takes precedence)
    if (activeTab !== "all") {
      filtered = filtered.filter(set => set.type === activeTab);
    } else if (typeFilter) {
      // Only apply type filter if we're in the "all" tab
      filtered = filtered.filter(set => set.type === typeFilter);
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        set => 
          set.title.toLowerCase().includes(searchLower) ||
          set.description.toLowerCase().includes(searchLower) ||
          String(set.id).includes(searchLower)
      );
    }

    // Filter by difficulty
    if (difficultyFilter) {
      filtered = filtered.filter(set => set.difficulty === difficultyFilter);
    }

    // Sort the results
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "a-z":
          return a.title.localeCompare(b.title);
        case "z-a":
          return b.title.localeCompare(a.title);
        case "difficulty-asc":
          return a.difficulty - b.difficulty;
        case "difficulty-desc":
          return b.difficulty - a.difficulty;
        case "questions-asc":
          return (a.questionIds?.length || 0) - (b.questionIds?.length || 0);
        case "questions-desc":
          return (b.questionIds?.length || 0) - (a.questionIds?.length || 0);
        case "newest":
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [practiceSets, activeTab, search, typeFilter, difficultyFilter, sortOption]);

  // Handle loading errors
  useEffect(() => {
    if (isPracticeSetsError) {
      toast({
        title: "Error",
        description: "Failed to load practice sets. Please try again.",
        variant: "destructive",
      });
    }
  }, [isPracticeSetsError, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Practice Sets</h2>
          <p className="text-muted-foreground">
            Create and manage practice sets for students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportExportButtons 
            onExport={handleExport}
            onImport={handleImport}
            isImporting={createMutation.isPending}
            isExporting={isExporting}
          />
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Practice Set
          </Button>
        </div>
      </div>
      
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        difficultyFilter={difficultyFilter}
        onDifficultyFilterChange={setDifficultyFilter}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
      />
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Sets</TabsTrigger>
          <TabsTrigger value="verbal">Verbal</TabsTrigger>
          <TabsTrigger value="quantitative">Quantitative</TabsTrigger>
          <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          <TabsTrigger value="mixed">Mixed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          <PracticeSetTable
            practiceSets={filteredPracticeSets}
            isLoading={isLoadingPracticeSets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            isFiltering={activeFiltersCount > 0}
            onClearFilters={handleClearFilters}
          />
        </TabsContent>
        <TabsContent value="verbal" className="pt-4">
          <PracticeSetTable
            practiceSets={filteredPracticeSets}
            isLoading={isLoadingPracticeSets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            isFiltering={activeFiltersCount > 0}
            onClearFilters={handleClearFilters}
          />
        </TabsContent>
        <TabsContent value="quantitative" className="pt-4">
          <PracticeSetTable
            practiceSets={filteredPracticeSets}
            isLoading={isLoadingPracticeSets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            isFiltering={activeFiltersCount > 0}
            onClearFilters={handleClearFilters}
          />
        </TabsContent>
        <TabsContent value="vocabulary" className="pt-4">
          <PracticeSetTable
            practiceSets={filteredPracticeSets}
            isLoading={isLoadingPracticeSets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            isFiltering={activeFiltersCount > 0}
            onClearFilters={handleClearFilters}
          />
        </TabsContent>
        <TabsContent value="mixed" className="pt-4">
          <PracticeSetTable
            practiceSets={filteredPracticeSets}
            isLoading={isLoadingPracticeSets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            isFiltering={activeFiltersCount > 0}
            onClearFilters={handleClearFilters}
          />
        </TabsContent>
      </Tabs>
      
      {/* Form dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPracticeSet ? "Edit Practice Set" : "Create Practice Set"}
            </DialogTitle>
            <DialogDescription>
              {editingPracticeSet
                ? "Update the details of this practice set"
                : "Create a new practice set for students to practice with"}
            </DialogDescription>
          </DialogHeader>
          
          <NewPracticeSetForm
            onSubmit={handleFormSubmit}
            editingItem={editingPracticeSet}
            questions={questions}
            isLoading={isLoadingQuestions}
            isPending={createMutation.isPending || updateMutation.isPending}
            onCancel={handleFormClose}
          />
          
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button variant="outline" onClick={handleFormClose} disabled={createMutation.isPending || updateMutation.isPending}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the practice set 
              <span className="font-medium"> "{practiceSetToDelete?.title}"</span> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPracticeSetToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewPracticeSetManager;