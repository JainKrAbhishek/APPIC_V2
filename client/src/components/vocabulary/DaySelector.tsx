import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DaySelectorProps {
  selectedDay: number;
  totalDays: number;
  onDayChange: (day: number) => void;
}

const DaySelector = ({ selectedDay, totalDays, onDayChange }: DaySelectorProps) => {
  // Determine which days to show in the selector
  // Show days around the selected day
  const getDaysToShow = () => {
    const days = [];
    
    // Always show day 1
    days.push(1);
    
    // Show days around the selected day
    const startDay = Math.max(2, selectedDay - 2);
    const endDay = Math.min(totalDays - 1, selectedDay + 2);
    
    // Add ellipsis if there's a gap
    if (startDay > 2) {
      days.push('...');
    }
    
    // Add days around selected day
    for (let i = startDay; i <= endDay; i++) {
      days.push(i);
    }
    
    // Add ellipsis if there's a gap before the last day
    if (endDay < totalDays - 1) {
      days.push('...');
    }
    
    // Always show the last day
    if (totalDays > 1) {
      days.push(totalDays);
    }
    
    return days;
  };
  
  const daysToShow = getDaysToShow();
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Select Day</h3>
      <div className="flex flex-wrap gap-2">
        {daysToShow.map((day, index) => 
          typeof day === 'number' ? (
            <Button
              key={index}
              onClick={() => onDayChange(day)}
              variant={day === selectedDay ? "default" : "outline"}
              className={cn(
                day === selectedDay 
                  ? "bg-primary text-white" 
                  : "bg-white/90 text-gray-700 hover:bg-primary/10 hover:text-primary"
              )}
              size="sm"
            >
              Day {day}
            </Button>
          ) : (
            <div key={index} className="flex items-center text-gray-400 mx-1">
              {day}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DaySelector;