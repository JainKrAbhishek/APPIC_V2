import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { BarChart3, FileText, PenLine } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { User } from '@shared/schema';

// Import custom components
import { 
  EssayPromptCard, 
  EssayFilterBar, 
  EssayFeatureCards, 
  EssayTipsSection
} from '@/components/essay';

// Import the EssayPrompt interface from the component
import { EssayPrompt } from '@/components/essay/EssayPromptCard';

const EssayPrompts: React.FC = () => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Fetch user data
  const { data: userData } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });
  
  // Load essay prompts
  const { data: prompts, isLoading } = useQuery<EssayPrompt[]>({
    queryKey: ['/api/essays/prompts'],
    queryFn: async () => {
      const response = await apiRequest<EssayPrompt[]>('/api/essays/prompts');
      return response || [];
    },
  });
  
  // Filter prompts based on search query and active tab
  const filteredPrompts = React.useMemo(() => {
    if (!prompts) return [];
    
    return prompts.filter((prompt: EssayPrompt) => {
      // Filter by tab
      if (activeTab === 'issue' && prompt.taskType !== 'issue') return false;
      if (activeTab === 'argument' && prompt.taskType !== 'argument') return false;
      
      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          prompt.title.toLowerCase().includes(searchLower) ||
          prompt.description.toLowerCase().includes(searchLower) ||
          prompt.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [prompts, activeTab, searchQuery]);

  // Go to history page
  const handleViewHistory = () => {
    setLocation('/essays/history');
  };
  
  if (isLoading) {
    return (
      <DashboardLayout title="Analytical Writing" user={userData}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="w-full max-w-md flex flex-col items-center">
            <div className="mb-6 animate-pulse">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <PenLine className="h-10 w-10 text-blue-500" />
              </div>
            </div>
            <Progress value={60} className="w-64 mb-6" />
            <p className="text-center text-lg text-muted-foreground">Loading Essay Prompts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Analytical Writing" user={userData}>
      <div className="grid gap-8">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-6 w-6 text-blue-500" />
            <h1 className="text-3xl font-bold tracking-tight">Analytical Writing</h1>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <p className="text-muted-foreground text-lg max-w-3xl">
              Improve your analytical writing skills with official GRE-style essay tasks.
              Get detailed AI feedback on your writing and track your progress.
            </p>
            
            <Button 
              onClick={handleViewHistory} 
              variant="outline" 
              className="shrink-0 flex items-center hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Essay History
            </Button>
          </div>
          
          {/* Feature Cards */}
          <EssayFeatureCards />
        </div>
        
        {/* Prompt Selection Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Select an Essay Topic</h2>
          
          <div className="grid gap-6">
            {/* Filter and Search */}
            <EssayFilterBar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            
            {/* No Results */}
            {filteredPrompts.length === 0 ? (
              <Card className="bg-white/80 border border-blue-100">
                <CardContent className="pt-6">
                  <div className="text-center p-12">
                    <h3 className="text-lg font-medium mb-2">No essay topics found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No topics found matching your search for "${searchQuery}"`
                        : "There are no essay topics available for this category."
                      }
                    </p>
                    {searchQuery && (
                      <Button 
                        variant="outline"
                        className="mt-4"
                        onClick={() => setSearchQuery('')}
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Essay Prompt Cards Grid
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPrompts.map((prompt: EssayPrompt) => (
                  <EssayPromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Tips Section */}
        <EssayTipsSection />
      </div>
    </DashboardLayout>
  );
};

export default EssayPrompts;