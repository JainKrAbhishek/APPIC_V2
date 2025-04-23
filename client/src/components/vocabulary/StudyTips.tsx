import React, { useState } from 'react';
import { Lightbulb, BookOpen, Repeat, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface StudyTipProps {
  tip: string;
  icon: React.ReactNode;
}

const StudyTip = ({ tip, icon }: StudyTipProps) => {
  return (
    <div className="flex items-center p-2.5 bg-white/80 rounded-lg border border-gray-100">
      <div className="flex-shrink-0 p-1.5 bg-primary/10 rounded-md text-primary">
        {icon}
      </div>
      <p className="ml-2.5 text-xs text-gray-600">{tip}</p>
    </div>
  );
};

const StudyTips = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const tips = [
    {
      tip: "Focus on understanding the word in context, not just memorizing definitions.",
      icon: <Lightbulb size={16} />
    },
    {
      tip: "Read example sentences aloud to improve pronunciation and retention.",
      icon: <BookOpen size={16} />
    },
    {
      tip: "Review previously learned words regularly to strengthen your memory.",
      icon: <Repeat size={16} />
    },
    {
      tip: "Study in short, focused sessions throughout the day for better results.",
      icon: <Clock size={16} />
    }
  ];

  return (
    <div className="mb-3">
      <Button 
        variant="ghost" 
        className="w-full flex items-center justify-between p-2 bg-white/20 hover:bg-white/40 rounded-lg mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-medium text-gray-700">Study Tips</span>
        {isExpanded ? 
          <ChevronUp size={16} className="text-gray-500" /> : 
          <ChevronDown size={16} className="text-gray-500" />}
      </Button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tips.map((tip, index) => (
                <StudyTip key={index} tip={tip.tip} icon={tip.icon} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyTips;