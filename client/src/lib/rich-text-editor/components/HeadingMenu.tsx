import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Heading1, Heading2, Heading3, Pilcrow } from 'lucide-react';
import { useEditorOperations } from '../hooks';

/**
 * Dropdown menu for heading options
 */
const HeadingMenu: React.FC = () => {
  const { toggleBlock, isBlockActive } = useEditorOperations();

  const currentHeading = () => {
    if (isBlockActive('heading-one')) return 'H1';
    if (isBlockActive('heading-two')) return 'H2';
    if (isBlockActive('heading-three')) return 'H3';
    return 'Text';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-3 gap-1 text-xs">
          {currentHeading()}
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => toggleBlock('paragraph')} className="gap-2">
          <Pilcrow size={16} />
          <span>Normal text</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleBlock('heading-one')} className="gap-2">
          <Heading1 size={16} />
          <span>Heading 1</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleBlock('heading-two')} className="gap-2">
          <Heading2 size={16} />
          <span>Heading 2</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleBlock('heading-three')} className="gap-2">
          <Heading3 size={16} />
          <span>Heading 3</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeadingMenu;