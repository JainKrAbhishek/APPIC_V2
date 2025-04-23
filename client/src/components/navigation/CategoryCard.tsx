import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  totalTopics: number;
  completedTopics: number;
  onClick: () => void;
}

const CategoryCard = ({ 
  title, 
  description, 
  icon, 
  color, 
  totalTopics, 
  completedTopics, 
  onClick 
}: CategoryCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  
  return (
    <Card 
      className={`h-full transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-100 
        ${isHovered ? 'shadow-lg transform -translate-y-1' : 'shadow hover:shadow-md'}`}
      style={{ borderTop: `4px solid ${color}`, borderRadius: '12px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
        <div className="flex items-start justify-between">
          <div className="rounded-lg p-2.5 sm:p-3 shadow-sm" 
            style={{ 
              backgroundColor: `${color}20`, 
              boxShadow: `0 2px 8px ${color}15`
            }}>
            {icon}
          </div>
          <Badge 
            variant="outline" 
            className="px-2.5 py-1 text-xs font-medium bg-white shadow-sm border-gray-100"
          >
            {completedTopics > 0 ? 
              <span className="text-emerald-600">{`${completedTopics}/${totalTopics}`}</span> : 
              <span className="text-gray-500">{`${completedTopics}/${totalTopics}`}</span>
            }
          </Badge>
        </div>
        <CardTitle className="mt-4 text-lg sm:text-xl font-bold">{title}</CardTitle>
        <CardDescription className="mt-1 text-xs sm:text-sm line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-2 sm:px-6 sm:pb-3 pt-0">
        <div className="space-y-2 bg-gray-50/70 p-3 rounded-lg border border-gray-100/80">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500 font-medium">Progress</span>
            <span className="font-bold" style={{ color }}>
              {completionPercentage}%
            </span>
          </div>
          <Progress 
            value={completionPercentage} 
            className="h-2 sm:h-2.5" 
            style={{ 
              backgroundColor: `${color}20`,
              '--progress-foreground': color 
            } as React.CSSProperties} 
          />
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2">
        <Button 
          className="w-full gap-1 sm:gap-2 mt-1 sm:mt-2 group text-sm sm:text-base py-1.5 sm:py-2 h-auto
            transition-all duration-300 shadow-sm hover:shadow shadow-[0_4px_12px_rgba(0,0,0,0.05)]
            font-medium rounded-xl" 
          onClick={onClick}
          style={{ 
            backgroundColor: color,
            color: '#fff',
            border: 'none'
          }}
        >
          <span className="hidden xs:inline">Continue Learning</span>
          <span className="xs:hidden">Start</span>
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 
            group-hover:translate-x-1.5 animate-pulse-subtle" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CategoryCard;