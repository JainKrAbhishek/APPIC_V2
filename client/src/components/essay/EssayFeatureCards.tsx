import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PenLine, Sparkles, Trophy } from 'lucide-react';

const EssayFeatureCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
      <FeatureCard 
        icon={<PenLine className="h-5 w-5 text-blue-600" />}
        title="Writing"
        description="30-minute timed essays"
        bgColor="bg-blue-50"
        borderColor="border-blue-100"
        iconBgColor="bg-blue-100"
      />
      
      <FeatureCard 
        icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
        title="AI Feedback"
        description="Detailed scoring and analysis"
        bgColor="bg-emerald-50"
        borderColor="border-emerald-100"
        iconBgColor="bg-emerald-100"
      />
      
      <FeatureCard 
        icon={<Trophy className="h-5 w-5 text-purple-600" />}
        title="Progress"
        description="Track your improvement"
        bgColor="bg-purple-50"
        borderColor="border-purple-100"
        iconBgColor="bg-purple-100"
      />
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  bgColor,
  borderColor,
  iconBgColor
}) => {
  return (
    <Card className={`${bgColor} ${borderColor} transform transition-transform duration-300 hover:scale-105`}>
      <CardContent className="pt-6 pb-4 px-4">
        <div className="flex items-start gap-3">
          <div className={`${iconBgColor} p-2 rounded-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EssayFeatureCards;