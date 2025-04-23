import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw, Plus, Layers } from "lucide-react";

import ContentSelectionTable from "./ContentSelectionTable";
import BulkActionForm from "./BulkActionForm";
import { 
  contentTypeOptions, 
  userTypeOptions, 
  BulkActionFormValues,
  Content
} from "./types";
import { 
  useAccessRules, 
  useContentList, 
  useBulkCreateAccessRules 
} from "./hooks";

interface BulkActionsTabProps {
  selectedContentType: string;
  setSelectedContentType: (contentType: string) => void;
  selectedUserType: string;
  setSelectedUserType: (userType: string) => void;
  searchTerm?: string;
}

const BulkActionsTab: React.FC<BulkActionsTabProps> = ({
  selectedContentType,
  setSelectedContentType,
  selectedUserType,
  setSelectedUserType,
  searchTerm = "",
}) => {
  const [isBulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content[]>([]);
  const [filteredContentList, setFilteredContentList] = useState<Content[]>([]);
  
  // Fetch data
  const { 
    data: accessRules = [], 
    isLoading: loadingRules 
  } = useAccessRules(selectedContentType, selectedUserType);
  
  const { 
    data: contentList = [], 
    isLoading: loadingContent 
  } = useContentList(selectedContentType);
  
  // Mutations
  const bulkCreateRulesMutation = useBulkCreateAccessRules();

  // Filter content based on what already has rules
  useEffect(() => {
    if (contentList && accessRules && Array.isArray(accessRules)) {
      const existingContentIds = accessRules.map(rule => rule.contentId);
      // For bulk actions, show content that doesn't have rules yet
      let filteredList = contentList.filter(content => !existingContentIds.includes(content.id));
      
      // Apply search filter if search term exists
      if (searchTerm && searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        filteredList = filteredList.filter(content => 
          content.name?.toLowerCase().includes(searchLower) || 
          content.title?.toLowerCase().includes(searchLower) ||
          content.description?.toLowerCase().includes(searchLower) ||
          String(content.id).includes(searchTerm)
        );
      }
      
      setFilteredContentList(filteredList);
    } else if (contentList) {
      // If access rules is not available or not an array, just show all content
      let allContent = [...contentList];
      
      // Apply search filter if search term exists
      if (searchTerm && searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        allContent = allContent.filter(content => 
          content.name?.toLowerCase().includes(searchLower) || 
          content.title?.toLowerCase().includes(searchLower) ||
          content.description?.toLowerCase().includes(searchLower) ||
          String(content.id).includes(searchTerm)
        );
      }
      
      setFilteredContentList(allContent);
    }
  }, [contentList, accessRules, searchTerm]);

  // Handle content selection
  const handleContentSelect = (content: Content) => {
    if (selectedContent.some(c => c.id === content.id)) {
      setSelectedContent(selectedContent.filter(c => c.id !== content.id));
    } else {
      setSelectedContent([...selectedContent, content]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedContent.length === filteredContentList.length) {
      setSelectedContent([]);
    } else {
      setSelectedContent([...filteredContentList]);
    }
  };

  // Handle bulk form submission
  const onBulkSubmit = (data: BulkActionFormValues) => {
    // Add selected content IDs to form data
    const contentIds = selectedContent.map(content => content.id);
    if (contentIds.length === 0) {
      alert("Please select at least one content item");
      return;
    }
    
    bulkCreateRulesMutation.mutate({
      ...data,
      contentIds
    }, {
      onSuccess: () => {
        setBulkDialogOpen(false);
        setSelectedContent([]);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-col space-y-3 md:space-y-0 md:flex-row md:gap-4 justify-between">
        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:gap-2">
          <div className="flex items-center gap-2">
            <Select value={selectedContentType} onValueChange={setSelectedContentType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                {contentTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedUserType} onValueChange={setSelectedUserType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                {userTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                setSelectedContent([]);
              }}
              className="h-10 w-10 flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Dialog open={isBulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-1" 
              disabled={selectedContent.length === 0}
            >
              <Layers className="h-4 w-4" />
              <span>Bulk Apply ({selectedContent.length})</span>
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="bulk-actions-content-dialog-description">
            <div id="bulk-actions-content-dialog-description" className="sr-only">Perform bulk actions on content access settings</div>
            <DialogHeader>
              <DialogTitle>Bulk Access Control</DialogTitle>
              <DialogDescription>
                Set access permissions for {selectedContent.length} selected content items
              </DialogDescription>
            </DialogHeader>
            
            <BulkActionForm 
              onSubmit={onBulkSubmit} 
              isSubmitting={bulkCreateRulesMutation.isPending}
              selectedItemsCount={selectedContent.length}
              selectedContentType={selectedContentType}
              selectedUserType={selectedUserType}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ContentSelectionTable 
        contentList={filteredContentList}
        isLoading={loadingContent || loadingRules}
        selectedContent={selectedContent}
        onContentSelect={handleContentSelect}
        onSelectAll={handleSelectAll}
        emptyFilteredMessage={
          accessRules && accessRules.length > 0
            ? "All content of this type already has access rules defined for this user type."
            : "No content found for this type."
        }
      />
    </div>
  );
};

export default BulkActionsTab;