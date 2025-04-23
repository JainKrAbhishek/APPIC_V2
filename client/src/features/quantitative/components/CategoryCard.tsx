import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  totalTopics: number;
  completedTopics: number;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  description,
  icon,
  color,
  totalTopics,
  completedTopics,
  onClick
}) => {
  const completionPercentage = totalTopics > 0 
    ? Math.round((completedTopics / totalTopics) * 100) 
    : 0;
    
  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-0 shadow"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex">
          <div className="mr-4 flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/30`}>
              {icon}
            </div>
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-medium mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{description}</p>
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3">
                <CircularProgressbar 
                  value={completionPercentage} 
                  text={`${completionPercentage}%`}
                  styles={buildStyles({
                    textSize: '30px',
                    pathColor: `var(--${color}-500)`,
                    textColor: `var(--${color}-700)`,
                    trailColor: `var(--${color}-100)`,
                  })}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {completedTopics} of {totalTopics} topics completed
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;