import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { BookOpen, ChevronLeft } from "lucide-react";

interface TypeSelectorProps {
  types: string[] | undefined;
  selectedType: string | null;
  onTypeSelect: (type: string) => void;
  isLoading: boolean;
  onBackToDashboard: () => void;
}

/**
 * Component for selecting verbal learning types (e.g. Reading Comprehension, Text Completion)
 */
const TypeSelector: React.FC<TypeSelectorProps> = ({
  types,
  selectedType,
  onTypeSelect,
  isLoading,
  onBackToDashboard
}) => {
  // Define colors and icons for different verbal types
  const typeConfig: Record<string, { color: string, gradient: string, description: string }> = {
    'reading_comprehension': {
      color: 'from-blue-500 to-indigo-500',
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      description: 'Analyze passages and answer questions based on explicit and implicit information.'
    },
    'text_completion': {
      color: 'from-emerald-500 to-teal-500',
      gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      description: 'Fill in missing words in sentences to create coherent and meaningful text.'
    },
    'sentence_equivalence': {
      color: 'from-purple-500 to-violet-500',
      gradient: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      description: 'Select words that create sentences with equivalent meanings when inserted.'
    },
    'critical_reasoning': {
      color: 'from-amber-500 to-orange-500',
      gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      description: 'Analyze arguments, identify assumptions, and evaluate logical reasoning.'
    }
  };

  // Default configuration for any undefined verbal type
  const defaultTypeConfig = {
    color: 'from-gray-500 to-slate-500',
    gradient: 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
    description: 'Learn and practice verbal reasoning skills.'
  };

  // Format type name for display
  const formatTypeName = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, type: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTypeSelect(type);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full shadow-md">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle>Verbal Learning</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Dashboard
            </Button>
          </div>
          <CardDescription>
            Select a verbal learning area to begin studying
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground text-sm">Loading verbal learning types...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-md">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle>Verbal Learning</CardTitle>
          <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Button>
        </div>
        <CardDescription>
          Select a verbal learning area to begin studying
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {types && types.length > 0 ? (
              types.map((type) => {
                const config = typeConfig[type] || defaultTypeConfig;
                
                return (
                  <div
                    key={type}
                    className={`relative overflow-hidden rounded-lg shadow transition-all duration-300 ${
                      selectedType === type 
                        ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]' 
                        : 'hover:shadow-md hover:scale-[1.01]'
                    }`}
                    onClick={() => onTypeSelect(type)}
                    onKeyDown={(e) => handleKeyDown(e, type)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedType === type}
                  >
                    <div className={`bg-gradient-to-r ${config.gradient} p-6 h-full flex flex-col`}>
                      <div className="flex items-center mb-3">
                        <div className={`flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br ${config.color} text-white`}>
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <h3 className="ml-3 text-lg font-medium">{formatTypeName(type)}</h3>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {config.description}
                      </p>
                      
                      <div className="mt-4 text-sm text-primary font-medium">
                        View topics →
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No Learning Types Available</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  We couldn't find any verbal learning types. Please check back later or contact support for assistance.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TypeSelector;