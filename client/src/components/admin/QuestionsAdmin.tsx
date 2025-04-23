import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminStatusCheck from './AdminStatusCheck';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const QuestionsAdmin: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const createTestQuestion = async () => {
    setIsCreating(true);
    try {
      // First check the auth middleware
      console.log('Checking auth status...');
      const authCheckResponse = await fetch('/api/auth/check-admin', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const authCheckData = await authCheckResponse.json();
      console.log('Auth check response:', authCheckData);
      
      if (!authCheckResponse.ok) {
        toast({
          title: 'Authentication Error',
          description: `Auth check failed: ${authCheckData.message || 'Unknown error'}`,
          variant: 'destructive'
        });
        return;
      }
      
      // Try to create a simple test question
      const response = await apiRequest('/api/questions', {
        method: 'POST',
        data: {
          type: "quantitative",
          subtype: "multiple_choice",
          difficulty: 3,
          content: [{"type":"paragraph","children":[{"text":"Test question content"}]}],
          options: JSON.stringify([
            {"text":"Option A","isCorrect":true},
            {"text":"Option B","isCorrect":false},
            {"text":"Option C","isCorrect":false}
          ]),
          answer: "0",
          explanation: [{"type":"paragraph","children":[{"text":"Test explanation"}]}]
        }
      });
      
      toast({
        title: 'Success',
        description: 'Test question created successfully',
      });
      console.log('Question created:', response);
    } catch (error: any) {
      console.error('Error creating test question:', error);
      toast({
        title: 'Error',
        description: `Failed to create test question: ${error?.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <AdminStatusCheck onStatusChange={setIsAdmin} />
      
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Questions Admin Tools</CardTitle>
            <CardDescription>
              Create a test question to verify admin functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createTestQuestion} 
              disabled={isCreating}
              className="w-full sm:w-auto"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create Test Question'}
            </Button>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This will create a simple test question to verify that your admin permissions are working correctly.</p>
              <p className="mt-2">If this succeeds, you should be able to use the main Questions Manager.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionsAdmin;