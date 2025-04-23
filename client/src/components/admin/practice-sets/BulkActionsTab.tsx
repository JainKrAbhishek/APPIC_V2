import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";

import { PracticeSet, getTypeBadgeVariant, getTypeIcon, BulkActionFormValues } from "./types";
import { useBulkDeletePracticeSets, useBulkCopyPracticeSets, useBulkUpdatePracticeSets } from "./hooks";
import { invalidateAllPracticeSetQueries } from "@/features/practice/hooks";
import BulkActionForm from "./BulkActionForm";
import { PracticeSetManager as TopicManager } from "@/components/admin/PracticeSetManager";

interface BulkActionsTabProps {
  practiceSets: PracticeSet[];
  filteredPracticeSets: PracticeSet[];
  isLoading: boolean;
  refetch: () => void;
}

const BulkActionsTab: React.FC<BulkActionsTabProps> = ({
  practiceSets,
  filteredPracticeSets,
  isLoading,
  refetch,
}) => {
  // State for selected practice sets
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Dialog states
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkCopyOpen, setConfirmBulkCopyOpen] = useState(false);
  
  // Mutations
  const bulkDeleteMutation = useBulkDeletePracticeSets();
  const bulkCopyMutation = useBulkCopyPracticeSets();
  const bulkUpdateMutation = useBulkUpdatePracticeSets();
  
  // Check if all items are selected
  const isAllSelected = filteredPracticeSets.length > 0 && 
    filteredPracticeSets.every(item => selectedIds.includes(item.id));
  
  // Handle select all
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPracticeSets.map(item => item.id));
    }
  };
  
  // Handle select individual item
  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };
  
  // Handle bulk update
  const handleBulkUpdate = (data: BulkActionFormValues) => {
    if (selectedIds.length === 0) return;
    
    // Only include fields that have values
    const updateData: Partial<PracticeSet> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    
    // Check if there are changes
    if (Object.keys(updateData).length === 0) {
      alert("No changes selected for update");
      return;
    }

    // Get the selected practice sets to determine which types to invalidate
    const selectedSets = practiceSets.filter(set => selectedIds.includes(set.id));
    const distinctTypes = Array.from(new Set(selectedSets.map(set => set.type)));
    
    bulkUpdateMutation.mutate({
      ids: selectedIds,
      data: updateData
    }, {
      onSuccess: () => {
        setBulkActionDialogOpen(false);
        setSelectedIds([]);
        
        // Invalidate queries for all affected types and possibly the new type
        const typesToInvalidate = [...distinctTypes];
        if (updateData.type && !typesToInvalidate.includes(updateData.type)) {
          typesToInvalidate.push(updateData.type);
        }
        
        // Use the central utility to ensure all components stay in sync
        invalidateAllPracticeSetQueries(typesToInvalidate, { immediate: true });
        refetch();
      }
    });
  };
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    // Get the selected practice sets to determine which types to invalidate
    const selectedSets = practiceSets.filter(set => selectedIds.includes(set.id));
    const distinctTypes = Array.from(new Set(selectedSets.map(set => set.type)));
    
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setConfirmBulkDeleteOpen(false);
        setSelectedIds([]);
        
        // Use the central utility to ensure all components stay in sync
        invalidateAllPracticeSetQueries(distinctTypes, { immediate: true });
        refetch();
      }
    });
  };
  
  // Handle bulk copy
  const handleBulkCopy = () => {
    if (selectedIds.length === 0) return;
    
    // Get the selected practice sets to determine which types to invalidate
    const selectedSets = practiceSets.filter(set => selectedIds.includes(set.id));
    const distinctTypes = Array.from(new Set(selectedSets.map(set => set.type)));
    
    bulkCopyMutation.mutate(selectedIds, {
      onSuccess: () => {
        setConfirmBulkCopyOpen(false);
        setSelectedIds([]);
        
        // Use the central utility to ensure all components stay in sync
        invalidateAllPracticeSetQueries(distinctTypes, { immediate: true });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Practice Set Topic Manager */}
      <TopicManager />
      
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedIds.length} of {filteredPracticeSets.length} selected
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setBulkActionDialogOpen(true)}
            disabled={selectedIds.length === 0}
          >
            Edit Selected
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setConfirmBulkCopyOpen(true)}
            disabled={selectedIds.length === 0}
          >
            Duplicate Selected
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => setConfirmBulkDeleteOpen(true)}
            disabled={selectedIds.length === 0}
          >
            Delete Selected
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[50px] hidden md:table-cell">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[100px] hidden sm:table-cell">Questions</TableHead>
              <TableHead className="w-[100px] hidden md:table-cell">Difficulty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPracticeSets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No practice sets found
                </TableCell>
              </TableRow>
            ) : (
              filteredPracticeSets.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(checked) => 
                        handleSelectItem(item.id, checked as boolean)
                      }
                      aria-label={`Select practice set ${item.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                    {item.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[230px] md:max-w-[300px]">
                      {item.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(item.type)} className="flex items-center gap-1 w-fit">
                      {getTypeIcon(item.type)}
                      <span>{item.type}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {item.questionIds.length} questions
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>
                        {i < item.difficulty ? "★" : "☆"}
                      </span>
                    ))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Bulk Edit Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent aria-describedby="practice-sets-bulk-add-dialog-description">
          <div id="practice-sets-bulk-add-dialog-description" className="sr-only">Add questions to practice sets in bulk</div>
          <DialogHeader>
            <DialogTitle>Edit {selectedIds.length} Practice Sets</DialogTitle>
            <DialogDescription>
              Update properties for all selected practice sets at once.
            </DialogDescription>
          </DialogHeader>
          
          <BulkActionForm
            onSubmit={handleBulkUpdate}
            isPending={bulkUpdateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmBulkDeleteOpen} onOpenChange={setConfirmBulkDeleteOpen}>
          <div id="practice-sets-bulk-remove-dialog-description" className="sr-only">Remove questions from practice sets in bulk</div>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Bulk Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} practice sets? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmBulkDeleteOpen(false)}
              disabled={bulkDeleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete {selectedIds.length} Practice Sets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Copy Dialog */}
          <div id="practice-sets-delete-dialog-description" className="sr-only">Delete selected practice sets</div>
      <Dialog open={confirmBulkCopyOpen} onOpenChange={setConfirmBulkCopyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Duplicate</DialogTitle>
            <DialogDescription>
              This will create {selectedIds.length} new copies of the selected practice sets. Continue?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmBulkCopyOpen(false)}
              disabled={bulkCopyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkCopy}
              disabled={bulkCopyMutation.isPending}
            >
              {bulkCopyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Duplicate {selectedIds.length} Practice Sets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkActionsTab;