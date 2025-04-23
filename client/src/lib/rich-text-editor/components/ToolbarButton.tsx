import React from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { ToolbarButtonProps } from '../types';

/**
 * Button component for editor toolbar with tooltip
 */
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  icon, 
  tooltip, 
  active = false, 
  onClick 
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={active ? "default" : "ghost"}
            size="sm"
            className={`h-8 w-8 p-0 ${active ? 'bg-secondary text-secondary-foreground' : ''}`}
            onClick={e => {
              e.preventDefault();
              onClick();
            }}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ToolbarButton;