import React, { useState } from "react";
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
import { RefreshCw, Plus, ShieldCheck } from "lucide-react";

import AccessRuleTable from "./AccessRuleTable";
import AccessRuleForm from "./AccessRuleForm";
import { 
  contentTypeOptions, 
  userTypeOptions, 
  AccessRuleFormValues 
} from "./types";
import { 
  useAccessRules, 
  useCreateAccessRule, 
  useUpdateAccessRule, 
  useDeleteAccessRule 
} from "./hooks";

interface AccessRulesTabProps {
  selectedContentType: string;
  setSelectedContentType: (contentType: string) => void;
  selectedUserType: string;
  setSelectedUserType: (userType: string) => void;
  searchTerm?: string;
}

const AccessRulesTab: React.FC<AccessRulesTabProps> = ({
  selectedContentType,
  setSelectedContentType,
  selectedUserType,
  setSelectedUserType,
  searchTerm = "",
}) => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Fetch data
  const { 
    data: accessRules = [], 
    isLoading: loadingRules, 
    refetch: refetchRules 
  } = useAccessRules(selectedContentType, selectedUserType);
  
  // Filter rules based on search term if provided
  const filteredAccessRules = searchTerm && searchTerm.trim() !== "" 
    ? accessRules.filter((rule: any) => 
        rule.contentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(rule.id).includes(searchTerm) ||
        rule.contentType?.toLowerCase().includes(searchTerm.toLowerCase())
      ) 
    : accessRules;
  
  // Mutations
  const createRuleMutation = useCreateAccessRule();
  const updateRuleMutation = useUpdateAccessRule();
  const deleteRuleMutation = useDeleteAccessRule();

  // Handle form submission
  const onSubmit = (data: AccessRuleFormValues) => {
    createRuleMutation.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      }
    });
  };

  // Handle toggle access
  const handleToggleAccess = (rule: any) => {
    updateRuleMutation.mutate({
      id: rule.id,
      isAccessible: !rule.isAccessible
    });
  };

  // Handle delete rule
  const handleDeleteRule = (id: number) => {
    if (confirm("Are you sure you want to delete this access rule?")) {
      deleteRuleMutation.mutate(id);
    }
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
              onClick={() => refetchRules()}
              className="h-10 w-10 flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Rule</span>
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="access-rule-dialog-description">
            <div id="access-rule-dialog-description" className="sr-only">Form for managing content access rules</div>
            <DialogHeader>
              <DialogTitle>Create New Access Rule</DialogTitle>
              <DialogDescription>
                Define who can access specific content based on user subscription level
              </DialogDescription>
            </DialogHeader>
            
            <AccessRuleForm 
              onSubmit={onSubmit} 
              isSubmitting={createRuleMutation.isPending} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <AccessRuleTable 
        accessRules={filteredAccessRules} 
        isLoading={loadingRules}
        selectedContentType={selectedContentType}
        onToggleAccess={handleToggleAccess}
        onDeleteRule={handleDeleteRule}
      />
    </div>
  );
};

export default AccessRulesTab;