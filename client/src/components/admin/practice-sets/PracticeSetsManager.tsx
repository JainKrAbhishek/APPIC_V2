import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FilePenLine, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListFilter } from "lucide-react";

import { PracticeSet, PracticeSetFormValues } from "./types";
import { 
  usePracticeSets,
  useQuestions,
  useFilteredPracticeSets,
  useCreatePracticeSet,
  useUpdatePracticeSet,
  useDeletePracticeSet
} from "./hooks";
import { invalidateAllPracticeSetQueries } from "@/features/practice/hooks";
import { useToast } from "@/hooks/use-toast";
import PracticeSetForm from "./PracticeSetFormFixed";
import PracticeSetTable from "./PracticeSetTable";
import BulkActionsTab from "./BulkActionsTab";
import FilterBar from "./FilterBar";

interface PracticeSetsManagerProps {
  searchTerm?: string;
}

const PracticeSetsManager: React.FC<PracticeSetsManagerProps> = ({ searchTerm = "" }) => {
  // Get the toast utility
  const toastUtils = useToast();
  
  // Tabs state with persistence
  const [activeTab, setActiveTab] = useState(() => {
    // Get tab from storage or use default
    const storedTab = localStorage.getItem('practiceSetsManagerTab');
    return storedTab || "management";
  });
  
  // Save tab state to localStorage
  useEffect(() => {
    localStorage.setItem('practiceSetsManagerTab', activeTab);
  }, [activeTab]);
  
  // Prevent this component from interfering with parent navigation
  useEffect(() => {
    // Block any parent component navigation when this component mounts
    // This is a temporary fix to prevent unwanted tab changes in the parent component
    const originalPushState = window.history.pushState;
    
    return () => {
      // Restore original history methods when component unmounts
      window.history.pushState = originalPushState;
    };
  }, []);
  
  // Filter and search states
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState("newest");
  
  // Update search term when external prop changes
  useEffect(() => {
    if (searchTerm !== undefined) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm]);
  
  // Edit and dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PracticeSet | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [practiceSetToDelete, setPracticeSetToDelete] = useState<PracticeSet | null>(null);
  
  // Fetch data
  const { practiceSets, isLoading: loadingPracticeSets, refetch: refetchPracticeSets } = usePracticeSets();
  const { questions, isLoading: loadingQuestions } = useQuestions();
  
  // Filter practice sets
  const { filteredPracticeSets, isFiltering } = useFilteredPracticeSets(
    practiceSets,
    localSearchTerm,
    filterType,
    selectedDifficulty
  );
  
  // Mutations
  const createPracticeSetMutation = useCreatePracticeSet();
  const updatePracticeSetMutation = useUpdatePracticeSet();
  const deletePracticeSetMutation = useDeletePracticeSet();
  
  // Clear filters
  const clearFilters = () => {
    setLocalSearchTerm("");
    setFilterType(null);
    setSelectedDifficulty(null);
  };
  
  // Handle adding new practice set
  const handleAddNew = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };
  
  // Handle edit practice set
  const handleEdit = (practiceSet: PracticeSet) => {
    setEditingItem(practiceSet);
    setDialogOpen(true);
  };
  
  // Handle delete practice set
  const handleDelete = (practiceSet: PracticeSet) => {
    setPracticeSetToDelete(practiceSet);
    setDeleteDialogOpen(true);
  };
  
  // Handle duplicate practice set
  const handleDuplicate = (practiceSet: PracticeSet) => {
    // Create a copy without the id
    const { id, ...practiceSetWithoutId } = practiceSet;
    
    // Add "Copy of" to the title
    const newPracticeSet = {
      ...practiceSetWithoutId,
      title: `Copy of ${practiceSet.title}`,
    };
    
    createPracticeSetMutation.mutate(newPracticeSet, {
      onSuccess: () => {
        // Instead of just refetching this specific instance,
        // invalidate all practice set queries to keep everything in sync
        invalidateAllPracticeSetQueries([practiceSet.type], { immediate: true });
        refetchPracticeSets();
        
        // Show success notification
        toastUtils.toast({
          title: "Success",
          description: `Duplicated practice set "${practiceSet.title}"`,
          variant: "default"
        });
      },
      onError: (error) => {
        console.error("Error duplicating practice set:", error);
        // Show error notification
        toastUtils.toast({
          title: "Error",
          description: "Failed to duplicate practice set",
          variant: "destructive"
        });
      }
    });
  };
  
  // Handle form submission
  const handleFormSubmit = (data: PracticeSetFormValues) => {
    console.log("PracticeSetsManager - handleFormSubmit received data:", data);
    
    // Validate question selection
    if (!data.questionIds || data.questionIds.length === 0) {
      // Show validation error 
      toastUtils.toast({
        title: "Selection Error",
        description: "Please select at least one question",
        variant: "destructive"
      });
      return;
    }
    
    if (editingItem) {
      console.log("Updating existing practice set:", editingItem.id);
      // When updating, make sure we're passing the complete and updated data
      const updatedData = {
        ...editingItem,  // Start with existing data
        ...data,         // Apply updates
      };
      
      console.log("Final update data:", updatedData);
      
      updatePracticeSetMutation.mutate(
        { id: editingItem.id, data: updatedData },
        {
          onSuccess: (response) => {
            console.log("Update successful, response:", response);
            setDialogOpen(false);
            // Invalidate all related queries to ensure UI sync 
            invalidateAllPracticeSetQueries([updatedData.type], { 
              includeQuestions: true,
              immediate: true
            });
            
            // Still do a direct refetch of this specific list for immediate UI update
            setTimeout(() => {
              refetchPracticeSets();
            }, 100);
            
            // Show success notification
            toastUtils.toast({
              title: "Success",
              description: `Updated practice set "${updatedData.title}"`,
              variant: "default"
            });
          },
          onError: (error) => {
            console.error("Error updating practice set:", error);
            // Show error notification
            toastUtils.toast({
              title: "Error",
              description: "Failed to update practice set",
              variant: "destructive"
            });
          }
        }
      );
    } else {
      console.log("Creating new practice set with data:", data);
      
      // Ensure questionIds is an array
      const finalData = {
        ...data,
        questionIds: Array.isArray(data.questionIds) ? data.questionIds : []
      };
      
      console.log("Final creation data:", finalData);
      
      createPracticeSetMutation.mutate(finalData, {
        onSuccess: (response) => {
          console.log("Creation successful, response:", response);
          setDialogOpen(false);
          
          // Invalidate all related queries to ensure UI sync across the application
          invalidateAllPracticeSetQueries([data.type], { 
            immediate: true,
            includeQuestions: false
          });
          
          // Force refetch
          refetchPracticeSets();
          
          // Show success notification
          toastUtils.toast({
            title: "Success",
            description: `Created practice set "${finalData.title}"`,
            variant: "default"
          });
        },
        onError: (error) => {
          console.error("Error creating practice set:", error);
          // Show error notification
          toastUtils.toast({
            title: "Error",
            description: "Failed to create practice set",
            variant: "destructive"
          });
        }
      });
    }
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!practiceSetToDelete) return;
    
    // Store the type before deletion so we can invalidate type-specific queries
    const typeToInvalidate = practiceSetToDelete.type;
    
    deletePracticeSetMutation.mutate(practiceSetToDelete.id, {
      onSuccess: () => {
        const title = practiceSetToDelete.title;
        setDeleteDialogOpen(false);
        setPracticeSetToDelete(null);
        
        // Invalidate all related queries to ensure UI sync across the application
        invalidateAllPracticeSetQueries([typeToInvalidate], { immediate: true });
        refetchPracticeSets();
        
        // Show success notification
        toastUtils.toast({
          title: "Success",
          description: `Deleted practice set "${title}"`,
          variant: "default"
        });
      },
      onError: (error) => {
        console.error("Error deleting practice set:", error);
        // Show error notification
        toastUtils.toast({
          title: "Error",
          description: "Failed to delete practice set",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePenLine className="h-5 w-5 text-primary" />
            Practice Sets Manager
          </CardTitle>
          <CardDescription>
            Create and manage practice sets for all sections of the GRE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="management">Management</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="management" className="m-0">
              <FilterBar
                search={localSearchTerm}
                onSearchChange={setLocalSearchTerm}
                typeFilter={filterType}
                onTypeFilterChange={setFilterType}
                difficultyFilter={selectedDifficulty}
                onDifficultyFilterChange={setSelectedDifficulty}
                sortOption={sortOption}
                onSortOptionChange={setSortOption}
                activeFiltersCount={
                  (localSearchTerm ? 1 : 0) +
                  (filterType ? 1 : 0) +
                  (selectedDifficulty ? 1 : 0)
                }
                onClearFilters={clearFilters}
                onAddNew={handleAddNew}
              />
              
              <PracticeSetTable
                practiceSets={filteredPracticeSets}
                isLoading={loadingPracticeSets}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                isFiltering={isFiltering}
                onClearFilters={clearFilters}
              />
              
              {practiceSets && practiceSets.length > 0 && (
                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                  <div>
                    Showing {filteredPracticeSets.length} of {practiceSets.length} practice sets
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="bulk" className="m-0">
              <Alert className="mb-4">
                <ListFilter className="h-4 w-4" />
                <AlertTitle>Bulk Actions Management</AlertTitle>
                <AlertDescription>
                  Select multiple practice sets to edit, delete, or duplicate them in bulk.
                </AlertDescription>
              </Alert>
              
              <BulkActionsTab
                practiceSets={practiceSets || []}
                filteredPracticeSets={filteredPracticeSets}
                isLoading={loadingPracticeSets}
                refetch={refetchPracticeSets}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Practice Set Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Practice Set" : "Create New Practice Set"}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Update the practice set information and question selection below." 
                : "Configure your practice set using the tabs below."}
            </DialogDescription>
          </DialogHeader>
          
          <PracticeSetForm
            onSubmit={handleFormSubmit}
            editingItem={editingItem}
            questions={questions}
            isLoading={loadingQuestions}
            isPending={createPracticeSetMutation.isPending || updatePracticeSetMutation.isPending}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete practice set "{practiceSetToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletePracticeSetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletePracticeSetMutation.isPending}
            >
              {deletePracticeSetMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PracticeSetsManager;