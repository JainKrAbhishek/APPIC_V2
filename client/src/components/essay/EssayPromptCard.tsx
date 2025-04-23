import React from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, PenLine, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Define the EssayPrompt interface
export interface EssayPrompt {
  id: number;
  title: string;
  description: string;
  taskType: 'issue' | 'argument';
  prompt: string;
  sampleEssay: string | null;
  difficultyLevel: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface EssayPromptCardProps {
  prompt: EssayPrompt;
}

const EssayPromptCard: React.FC<EssayPromptCardProps> = ({ prompt }) => {
  const [, setLocation] = useLocation();

  // Handle starting the essay writing process
  const handleStartWriting = () => {
    setLocation(`/essays/write/${prompt.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="flex flex-col h-full bg-white/90 border border-blue-100 hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge 
                variant={prompt.taskType === 'issue' ? 'default' : 'secondary'} 
                className="mb-2"
              >
                {prompt.taskType === 'issue' ? 'Issue Task' : 'Argument Task'}
              </Badge>
              <CardTitle className="line-clamp-2">{prompt.title}</CardTitle>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 shrink-0 mt-1">
              {getDifficultyIcon(prompt.difficultyLevel)}
            </div>
          </div>
          <CardDescription className="mt-1.5 flex items-center">
            <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> 
            <span className="text-muted-foreground">30 minutes • {getWordEstimate(prompt.difficultyLevel)} words</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="py-3 flex-grow">
          <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
            {prompt.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {prompt.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs bg-slate-50">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button
            onClick={handleStartWriting}
            className="w-full relative overflow-hidden group transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/30"
          >
            <div className="absolute inset-0 w-full h-full scale-0 rounded-full opacity-0 bg-white group-hover:scale-100 group-hover:opacity-20 origin-center transition-all duration-300"></div>
            <div className="flex items-center justify-center relative z-10">
              <PenLine className="mr-2 h-4 w-4" />
              Start Writing
            </div>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Helper function to get difficulty icon based on level
const getDifficultyIcon = (difficultyLevel: number) => {
  switch (difficultyLevel) {
    case 1:
      return <Star className="h-5 w-5 text-green-500" />;
    case 2:
      return <Star className="h-5 w-5 text-teal-500" />;
    case 3:
      return <Star className="h-5 w-5 text-blue-500" />;
    case 4:
      return <Star className="h-5 w-5 text-amber-500" />;
    case 5:
      return <Star className="h-5 w-5 text-red-500" />;
    default:
      return <Star className="h-5 w-5 text-blue-500" />;
  }
};

// Helper function to get word estimate based on difficulty
const getWordEstimate = (difficultyLevel: number): string => {
  switch (difficultyLevel) {
    case 1:
      return "350-450";
    case 2:
      return "400-500";
    case 3:
      return "450-550";
    case 4:
      return "500-600";
    case 5:
      return "550-650";
    default:
      return "450-550";
  }
};

export default EssayPromptCard;