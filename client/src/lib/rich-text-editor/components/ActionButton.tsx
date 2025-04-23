import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActionButtonProps {
  icon: React.ReactNode;
  tooltip?: string;
  onClick: () => void;
  shortcutText?: string;
}

/**
 * Generic action button for editor operations
 */
const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon, 
  tooltip, 
  onClick,
  shortcutText
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent side="bottom">
            <div className="flex flex-col">
              <span>{tooltip}</span>
              {shortcutText && (
                <span className="text-xs text-muted-foreground">{shortcutText}</span>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default ActionButton;