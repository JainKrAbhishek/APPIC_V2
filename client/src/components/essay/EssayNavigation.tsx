import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  PenLine, 
  BarChart3, 
  Home
} from 'lucide-react';

interface EssayNavigationProps {
  showBackButton?: boolean;
  currentPage?: 'prompts' | 'writing' | 'history' | 'view';
}

const EssayNavigation: React.FC<EssayNavigationProps> = ({ 
  showBackButton = true,
  currentPage
}) => {
  const [, setLocation] = useLocation();

  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };

  const handleBackToPrompts = () => {
    setLocation('/essays');
  };

  const handleViewHistory = () => {
    setLocation('/essays/history');
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm py-3 px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToDashboard} 
              className="mr-2"
            >
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-medium">Essay Practice</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={currentPage === 'prompts' ? 'default' : 'outline'}
            size="sm"
            onClick={handleBackToPrompts}
            className={currentPage === 'prompts' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Prompts</span>
          </Button>
          
          <Button
            variant={currentPage === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={handleViewHistory}
            className={currentPage === 'history' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">History</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EssayNavigation;