import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEditorOperations } from '../hooks';

interface AlignButtonProps {
  align: 'left' | 'center' | 'right';
  icon: React.ReactNode;
  tooltip?: string;
}

/**
 * Button for setting text alignment
 */
const AlignButton: React.FC<AlignButtonProps> = ({ 
  align, 
  icon, 
  tooltip,
}) => {
  const { isAlignActive, setAlign } = useEditorOperations();
  const isActive = isAlignActive(align);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setAlign(align)}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent side="bottom">
            <span>{tooltip}</span>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default AlignButton;