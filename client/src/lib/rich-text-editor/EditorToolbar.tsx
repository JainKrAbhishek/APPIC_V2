import React, { useState } from 'react';
import { useEditorOperations } from './hooks/editor-operations';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  ListOrdered,
  List,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Link as LinkIcon,
  Unlink,
  Table,
  CheckSquare,
  Minus,
  ChevronDown,
  Highlighter,
  Paintbrush,
  RotateCcw,
  RotateCw,
  CircleDot as FunctionIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import ColorPicker from './components/ColorPicker';
import FormulaMenu from './components/FormulaMenu';
import ImageMenu from './components/ImageMenu';

/**
 * The toolbar for the rich text editor
 * Provides buttons for all formatting options
 */
const EditorToolbar: React.FC = () => {
  const {
    isBlockActive,
    isAlignActive,
    isMarkActive,
    toggleMark,
    toggleBlock,
    setAlign,
    insertLink,
    toggleCheckListItem,
    insertCheckListItem,
    insertTable,
    insertHorizontalRule,
    undo,
    redo,
  } = useEditorOperations();

  const [isFormulaMenuOpen, setIsFormulaMenuOpen] = useState(false);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);

  // Create a tooltip wrapper for toolbar buttons
  const ToolbarButton = ({ 
    tooltip, 
    icon, 
    isActive = false, 
    onClick 
  }: { 
    tooltip: string;
    icon: React.ReactNode;
    isActive?: boolean;
    onClick: () => void;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={onClick}
          >
            {icon}
            <span className="sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Handle link insertion
  const handleAddLink = () => {
    const url = window.prompt('Enter the URL:');
    if (url) {
      insertLink(url);
    }
  };

  // Insert a table with specified dimensions
  const handleInsertTable = () => {
    const rows = window.prompt('Number of rows:', '3');
    const cols = window.prompt('Number of columns:', '3');
    if (rows && cols) {
      insertTable(parseInt(rows), parseInt(cols));
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-md p-1 bg-white dark:bg-gray-950 mb-2 flex flex-wrap items-center gap-1">
      {/* Basic Text Formatting */}
      <ToolbarButton
        tooltip="Bold"
        icon={<Bold className="h-4 w-4" />}
        isActive={isMarkActive('bold')}
        onClick={() => toggleMark('bold')}
      />
      <ToolbarButton
        tooltip="Italic"
        icon={<Italic className="h-4 w-4" />}
        isActive={isMarkActive('italic')}
        onClick={() => toggleMark('italic')}
      />
      <ToolbarButton
        tooltip="Underline"
        icon={<Underline className="h-4 w-4" />}
        isActive={isMarkActive('underline')}
        onClick={() => toggleMark('underline')}
      />
      <ToolbarButton
        tooltip="Strikethrough"
        icon={<Strikethrough className="h-4 w-4" />}
        isActive={isMarkActive('strikethrough')}
        onClick={() => toggleMark('strikethrough')}
      />
      <ToolbarButton
        tooltip="Code"
        icon={<Code className="h-4 w-4" />}
        isActive={isMarkActive('code')}
        onClick={() => toggleMark('code')}
      />
      <ToolbarButton
        tooltip="Highlight"
        icon={<Highlighter className="h-4 w-4" />}
        isActive={isMarkActive('highlight')}
        onClick={() => toggleMark('highlight')}
      />

      <Separator orientation="vertical" className="h-8" />

      {/* Colors */}
      <ColorPicker type="color" />
      <ColorPicker type="backgroundColor" />

      <Separator orientation="vertical" className="h-8" />

      {/* Headings and Block Formatting */}
      <ToolbarButton
        tooltip="Heading 1"
        icon={<Heading1 className="h-4 w-4" />}
        isActive={isBlockActive('heading-one')}
        onClick={() => toggleBlock('heading-one')}
      />
      <ToolbarButton
        tooltip="Heading 2"
        icon={<Heading2 className="h-4 w-4" />}
        isActive={isBlockActive('heading-two')}
        onClick={() => toggleBlock('heading-two')}
      />
      <ToolbarButton
        tooltip="Heading 3"
        icon={<Heading3 className="h-4 w-4" />}
        isActive={isBlockActive('heading-three')}
        onClick={() => toggleBlock('heading-three')}
      />
      <ToolbarButton
        tooltip="Block Quote"
        icon={<Quote className="h-4 w-4" />}
        isActive={isBlockActive('block-quote')}
        onClick={() => toggleBlock('block-quote')}
      />

      <Separator orientation="vertical" className="h-8" />

      {/* Lists */}
      <ToolbarButton
        tooltip="Bulleted List"
        icon={<List className="h-4 w-4" />}
        isActive={isBlockActive('bulleted-list')}
        onClick={() => toggleBlock('bulleted-list')}
      />
      <ToolbarButton
        tooltip="Numbered List"
        icon={<ListOrdered className="h-4 w-4" />}
        isActive={isBlockActive('numbered-list')}
        onClick={() => toggleBlock('numbered-list')}
      />
      <ToolbarButton
        tooltip="Check List"
        icon={<CheckSquare className="h-4 w-4" />}
        isActive={isBlockActive('check-list-item')}
        onClick={() => insertCheckListItem()}
      />

      <Separator orientation="vertical" className="h-8" />

      {/* Alignment */}
      <ToolbarButton
        tooltip="Align Left"
        icon={<AlignLeft className="h-4 w-4" />}
        isActive={isAlignActive('left')}
        onClick={() => setAlign('left')}
      />
      <ToolbarButton
        tooltip="Align Center"
        icon={<AlignCenter className="h-4 w-4" />}
        isActive={isAlignActive('center')}
        onClick={() => setAlign('center')}
      />
      <ToolbarButton
        tooltip="Align Right"
        icon={<AlignRight className="h-4 w-4" />}
        isActive={isAlignActive('right')}
        onClick={() => setAlign('right')}
      />

      <Separator orientation="vertical" className="h-8" />

      {/* Special Elements */}
      <ToolbarButton
        tooltip="Link"
        icon={<LinkIcon className="h-4 w-4" />}
        isActive={isMarkActive('link')}
        onClick={handleAddLink}
      />
      {/* Remove Link button temporarily disabled
      <ToolbarButton
        tooltip="Remove Link"
        icon={<Unlink className="h-4 w-4" />}
        onClick={() => {}}
      />
      */}
      <ToolbarButton
        tooltip="Image"
        icon={<ImageIcon className="h-4 w-4" />}
        onClick={() => setIsImageMenuOpen(true)}
      />
      <ToolbarButton
        tooltip="Formula"
        icon={<FunctionIcon className="h-4 w-4" />}
        onClick={() => setIsFormulaMenuOpen(true)}
      />
      <ToolbarButton
        tooltip="Table"
        icon={<Table className="h-4 w-4" />}
        onClick={handleInsertTable}
      />
      <ToolbarButton
        tooltip="Horizontal Rule"
        icon={<Minus className="h-4 w-4" />}
        onClick={() => insertHorizontalRule()}
      />

      <div className="flex-1" />

      {/* Undo/Redo */}
      <ToolbarButton
        tooltip="Undo"
        icon={<RotateCcw className="h-4 w-4" />}
        onClick={() => undo()}
      />
      <ToolbarButton
        tooltip="Redo"
        icon={<RotateCw className="h-4 w-4" />}
        onClick={() => redo()}
      />

      {/* Modals */}
      <FormulaMenu isOpen={isFormulaMenuOpen} onClose={() => setIsFormulaMenuOpen(false)} />
      <ImageMenu isOpen={isImageMenuOpen} onClose={() => setIsImageMenuOpen(false)} />
    </div>
  );
};

export default EditorToolbar;