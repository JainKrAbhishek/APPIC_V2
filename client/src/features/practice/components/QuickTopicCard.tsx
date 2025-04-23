import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PracticeSet } from '../types';
import { motion } from 'framer-motion';
import { ArrowRight, Calculator, BookMarked, BookOpen, Hash } from 'lucide-react';

export interface SubTopic {
  id: number;
  name: string;
  icon?: React.ReactNode;
  count: number;
}

interface QuickTopicCardProps {
  id: number;
  title: string;
  description: string;
  category: string;
  subtopics: SubTopic[];
  onTopicClick: (topicId: number) => void;
  onSubtopicClick: (subtopicId: number) => void;
}

const QuickTopicCard: React.FC<QuickTopicCardProps> = ({
  id,
  title,
  description,
  category,
  subtopics,
  onTopicClick,
  onSubtopicClick
}) => {
  // Get icon based on category
  const getIcon = () => {
    switch (category.toLowerCase()) {
      case 'algebra':
        return <Calculator className="h-5 w-5 text-blue-500" />;
      case 'arithmetic':
        return <Hash className="h-5 w-5 text-orange-500" />;
      case 'geometry':
        return <BookMarked className="h-5 w-5 text-green-500" />;
      default:
        return <BookOpen className="h-5 w-5 text-purple-500" />;
    }
  };

  // Get color scheme based on category
  const getColors = () => {
    switch (category.toLowerCase()) {
      case 'algebra':
        return {
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300',
          gradient: 'from-blue-500 to-indigo-600',
          border: 'hover:border-blue-300 dark:hover:border-blue-700',
          button: 'bg-blue-500 hover:bg-blue-600',
          subtopicBg: 'bg-blue-50 dark:bg-blue-900/20'
        };
      case 'arithmetic':
        return {
          badge: 'bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-300',
          gradient: 'from-orange-500 to-amber-600',
          border: 'hover:border-orange-300 dark:hover:border-orange-700',
          button: 'bg-orange-500 hover:bg-orange-600',
          subtopicBg: 'bg-orange-50 dark:bg-orange-900/20'
        };
      case 'geometry':
        return {
          badge: 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
          gradient: 'from-green-500 to-emerald-600',
          border: 'hover:border-green-300 dark:hover:border-green-700',
          button: 'bg-green-500 hover:bg-green-600',
          subtopicBg: 'bg-green-50 dark:bg-green-900/20'
        };
      default:
        return {
          badge: 'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-300',
          gradient: 'from-purple-500 to-violet-600',
          border: 'hover:border-purple-300 dark:hover:border-purple-700',
          button: 'bg-purple-500 hover:bg-purple-600',
          subtopicBg: 'bg-purple-50 dark:bg-purple-900/20'
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className={`h-full border shadow-md ${colors.border} transition-all duration-300`}>
        <CardHeader className={`bg-gradient-to-r ${colors.gradient} text-white`}>
          <div className="flex justify-between items-start">
            <Badge className="bg-white/20 hover:bg-white/25 text-white">
              {category}
            </Badge>
            <div className="bg-white/15 p-2 rounded-full">
              {getIcon()}
            </div>
          </div>
          <CardTitle className="text-xl mt-2">{title}</CardTitle>
          <CardDescription className="text-white/80 mt-1">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Related Subtopics:</h4>
          <div className="space-y-2">
            {subtopics.length > 0 ? (
              subtopics.map((subtopic) => (
                <motion.div
                  key={subtopic.id}
                  whileHover={{ x: 3 }}
                  className={`p-2 rounded-md ${colors.subtopicBg} cursor-pointer flex items-center justify-between`}
                  onClick={() => onSubtopicClick(subtopic.id)}
                >
                  <div className="flex items-center gap-2">
                    {subtopic.icon || getIcon()}
                    <span className="text-sm font-medium">{subtopic.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {subtopic.count} set{subtopic.count !== 1 ? 's' : ''}
                  </Badge>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No subtopics available</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            className={`w-full ${colors.button} text-white`}
            onClick={() => onTopicClick(id)}
          >
            <span>Explore All Sets</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default QuickTopicCard;