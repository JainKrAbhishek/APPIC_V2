import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

/**
 * Admin component for managing practice sets
 * Provides functionality to create new practice sets and update topic associations
 */
export function PracticeSetManager() {
  const [loading, setLoading] = useState({
    createSets: false,
    updateAssociations: false
  });

  // Function to create new practice sets
  const handleCreatePracticeSets = async () => {
    try {
      setLoading(prev => ({ ...prev, createSets: true }));
      
      const response = await fetch('/api/admin/create-practice-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "New practice sets created successfully",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create practice sets",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating practice sets:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating practice sets",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, createSets: false }));
    }
  };

  // Function to update practice set topic associations
  const handleUpdateTopicAssociations = async () => {
    try {
      setLoading(prev => ({ ...prev, updateAssociations: true }));
      
      const response = await fetch('/api/admin/update-practice-set-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Practice set topic associations updated successfully",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update practice set topic associations",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating topic associations:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating topic associations",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, updateAssociations: false }));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Practice Set Management</CardTitle>
        <CardDescription>
          Create and organize practice sets for various topics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Practice Set Operations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These operations help organize practice content by topic. First create practice sets, then 
            update their topic associations to ensure they appear under the correct topics.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button 
              variant="outline"
              onClick={handleCreatePracticeSets}
              disabled={loading.createSets}
              className="justify-start"
            >
              {loading.createSets ? "Creating..." : "Create New Practice Sets"}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleUpdateTopicAssociations}
              disabled={loading.updateAssociations}
              className="justify-start"
            >
              {loading.updateAssociations ? "Updating..." : "Update Practice Set Topic Associations"}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Note: These operations require admin privileges and may take a moment to complete.
        </p>
      </CardFooter>
    </Card>
  );
}

export default PracticeSetManager;