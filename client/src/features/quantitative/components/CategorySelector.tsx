import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { CategoryCard } from '@/features/quantitative/components';
import { BookOpen, ChevronLeft, Calculator, Brain, Sigma, Compass } from "lucide-react";

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string) => void;
  topicStats: Record<string, { total: number; completed: number }>;
  onBackToDashboard: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  topicStats,
  onBackToDashboard
}) => {
  // Define colors and icons for different categories
  const categoryConfig: Record<string, { color: string; icon: React.ReactNode; description: string }> = {
    'algebra': {
      color: 'blue',
      icon: <Sigma className="h-6 w-6 text-blue-500" />,
      description: 'Master equations, inequalities, functions, and algebraic operations.'
    },
    'arithmetic': {
      color: 'green',
      icon: <Calculator className="h-6 w-6 text-green-500" />,
      description: 'Build a solid foundation in number properties, fractions, decimals, and percentages.'
    },
    'geometry': {
      color: 'purple',
      icon: <Compass className="h-6 w-6 text-purple-500" />,
      description: 'Learn about shapes, angles, areas, volumes, and coordinate geometry.'
    },
    'data_analysis': {
      color: 'amber',
      icon: <Brain className="h-6 w-6 text-amber-500" />,
      description: 'Analyze statistical data, probability, distributions, and data interpretation.'
    }
  };

  // Default configuration for any undefined category
  const defaultCategoryConfig = {
    color: 'gray',
    icon: <BookOpen className="h-6 w-6 text-gray-500" />,
    description: 'Explore quantitative concepts and problem-solving methods.'
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (categories.length === 0) {
    return (
      <Card className="h-full shadow-md">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle>Quantitative Learning</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Dashboard
            </Button>
          </div>
          <CardDescription>
            Select a category to begin studying
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground text-sm">Loading categories...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-md">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle>Quantitative Learning</CardTitle>
          <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Button>
        </div>
        <CardDescription>
          Select a category to begin studying
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => {
              const config = categoryConfig[category] || defaultCategoryConfig;
              const stats = topicStats[category] || { total: 0, completed: 0 };
              
              return (
                <CategoryCard 
                  key={category}
                  title={formatCategoryName(category)}
                  description={config.description}
                  icon={config.icon}
                  color={config.color}
                  totalTopics={stats.total}
                  completedTopics={stats.completed}
                  onClick={() => onCategorySelect(category)}
                />
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CategorySelector;