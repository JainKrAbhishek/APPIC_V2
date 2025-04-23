import React from 'react';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Brain, CheckCircle, Search } from 'lucide-react';

interface EssayFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const EssayFilterBar: React.FC<EssayFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by title, description, or tags..."
          className="pl-10 bg-white/80 h-12 border-blue-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchQuery('')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
        <TabsList className="bg-white/80 border border-blue-200 p-1 h-12">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 h-10"
          >
            All Types
          </TabsTrigger>
          <TabsTrigger 
            value="issue" 
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 h-10"
          >
            <Brain className="mr-1 h-3.5 w-3.5" />
            Issue
          </TabsTrigger>
          <TabsTrigger 
            value="argument" 
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 h-10"
          >
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            Argument
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default EssayFilterBar;