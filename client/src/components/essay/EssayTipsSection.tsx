import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Award } from 'lucide-react';

const EssayTipsSection: React.FC = () => {
  return (
    <Card className="bg-slate-50 border-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Essay Writing Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-1.5">
              <span className="text-blue-500">•</span> Plan Your Structure
            </h3>
            <p className="text-sm text-muted-foreground">
              Start with a clear introduction, develop your ideas in 2-3 paragraphs, and finish with a strong conclusion.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-1.5">
              <span className="text-blue-500">•</span> Use Concrete Examples
            </h3>
            <p className="text-sm text-muted-foreground">
              Support your claims with specific examples from history, literature, science, or personal experiences.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-1.5">
              <span className="text-blue-500">•</span> Manage Your Time
            </h3>
            <p className="text-sm text-muted-foreground">
              Allocate 3-5 minutes for planning, 20-22 minutes for writing, and 3-5 minutes for review.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-1.5">
              <span className="text-blue-500">•</span> Language Matters
            </h3>
            <p className="text-sm text-muted-foreground">
              Use varied sentence structures and appropriate, rich vocabulary. Avoid repetition.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EssayTipsSection;