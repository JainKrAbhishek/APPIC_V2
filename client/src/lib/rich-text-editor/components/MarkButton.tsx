import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEditorOperations } from '../hooks';

interface MarkButtonProps {
  format: string;
  icon: React.ReactNode;
  tooltip?: string;
  shortcutText?: string;
}

/**
 * Button for toggling marks (formatting that applies to text)
 */
const MarkButton: React.FC<MarkButtonProps> = ({ 
  format, 
  icon, 
  tooltip, 
  shortcutText
}) => {
  const { isMarkActive, toggleMark } = useEditorOperations();
  const isActive = isMarkActive(format);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => toggleMark(format)}
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

export default MarkButton;