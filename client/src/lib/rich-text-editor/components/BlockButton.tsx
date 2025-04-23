import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEditorOperations } from '../hooks';

interface BlockButtonProps {
  format: string;
  icon: React.ReactNode;
  tooltip?: string;
  shortcutText?: string;
}

/**
 * Button for toggling block-level formatting
 */
const BlockButton: React.FC<BlockButtonProps> = ({ 
  format, 
  icon, 
  tooltip, 
  shortcutText
}) => {
  const { isBlockActive, toggleBlock } = useEditorOperations();
  const isActive = isBlockActive(format);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => toggleBlock(format)}
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

export default BlockButton;