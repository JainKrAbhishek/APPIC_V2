import React from 'react';
import { 
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  Quote, List, ListOrdered, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Link, Code, 
  Sigma, Table, Type, Check, X, ChevronDown,
  Palette, FileUp, RotateCw, RotateCcw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useEditorOperations } from '../hooks';
import ToolbarButton from './ToolbarButton';

/**
 * Toolbar component for rich text editor
 */
export const Toolbar: React.FC = () => {
  const { 
    isBlockActive,
    isAlignActive,
    isMarkActive,
    toggleBlock,
    setAlign,
    toggleMark,
    insertLink,
    insertInlineMath,
    insertMathBlock,
    insertImage
  } = useEditorOperations();

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 border border-input rounded-md bg-background mb-2">
      <div className="flex items-center space-x-1">
        <ToolbarButton 
          icon={<Bold size={16} />} 
          tooltip="Bold"
          active={isMarkActive('bold')}
          onClick={() => toggleMark('bold')}
        />
        <ToolbarButton 
          icon={<Italic size={16} />} 
          tooltip="Italic"
          active={isMarkActive('italic')}
          onClick={() => toggleMark('italic')}
        />
        <ToolbarButton 
          icon={<Underline size={16} />} 
          tooltip="Underline"
          active={isMarkActive('underline')}
          onClick={() => toggleMark('underline')}
        />
        <ToolbarButton 
          icon={<Code size={16} />} 
          tooltip="Code"
          active={isMarkActive('code')}
          onClick={() => toggleMark('code')}
        />
      </div>

      <div className="h-6 w-px bg-gray-200 mx-1" />

      <div className="flex items-center space-x-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Type size={16} />
              <span className="text-xs">Heading</span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Heading Level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className={isBlockActive('heading-one') ? 'bg-accent' : ''}
              onClick={() => toggleBlock('heading-one')}
            >
              <Heading1 size={16} className="mr-2" />
              <span>Heading 1</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={isBlockActive('heading-two') ? 'bg-accent' : ''}
              onClick={() => toggleBlock('heading-two')}
            >
              <Heading2 size={16} className="mr-2" />
              <span>Heading 2</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={isBlockActive('heading-three') ? 'bg-accent' : ''}
              onClick={() => toggleBlock('heading-three')}
            >
              <Heading3 size={16} className="mr-2" />
              <span>Heading 3</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={isBlockActive('paragraph') ? 'bg-accent' : ''}
              onClick={() => toggleBlock('paragraph')}
            >
              <Type size={16} className="mr-2" />
              <span>Normal</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarButton 
          icon={<Quote size={16} />} 
          tooltip="Quote"
          active={isBlockActive('block-quote')}
          onClick={() => toggleBlock('block-quote')}
        />
        <ToolbarButton 
          icon={<List size={16} />} 
          tooltip="Bulleted List"
          active={isBlockActive('bulleted-list')}
          onClick={() => toggleBlock('bulleted-list')}
        />
        <ToolbarButton 
          icon={<ListOrdered size={16} />} 
          tooltip="Numbered List"
          active={isBlockActive('numbered-list')}
          onClick={() => toggleBlock('numbered-list')}
        />
        <ToolbarButton 
          icon={<Check size={16} />} 
          tooltip="Check List"
          active={isBlockActive('check-list-item')}
          onClick={() => toggleBlock('check-list-item')}
        />
      </div>

      <div className="h-6 w-px bg-gray-200 mx-1" />

      <div className="flex items-center space-x-1">
        <ToolbarButton 
          icon={<AlignLeft size={16} />} 
          tooltip="Align Left"
          active={isAlignActive('left')}
          onClick={() => setAlign('left')}
        />
        <ToolbarButton 
          icon={<AlignCenter size={16} />} 
          tooltip="Align Center"
          active={isAlignActive('center')}
          onClick={() => setAlign('center')}
        />
        <ToolbarButton 
          icon={<AlignRight size={16} />} 
          tooltip="Align Right"
          active={isAlignActive('right')}
          onClick={() => setAlign('right')}
        />
      </div>

      <div className="h-6 w-px bg-gray-200 mx-1" />

      <div className="flex items-center space-x-1">
        <ToolbarButton 
          icon={<Link size={16} />} 
          tooltip="Insert Link"
          onClick={insertLink}
        />
        <ToolbarButton 
          icon={<ImageIcon size={16} />} 
          tooltip="Insert Image"
          onClick={insertImage}
        />
        <ToolbarButton 
          icon={<Table size={16} />} 
          tooltip="Insert Table"
          onClick={() => {
            // Insert a table with 2x2 cells
            const tableNode = {
              type: 'table',
              children: [
                {
                  type: 'table-row',
                  children: [
                    { type: 'table-header', children: [{ text: 'Header 1' }] },
                    { type: 'table-header', children: [{ text: 'Header 2' }] },
                  ],
                },
                {
                  type: 'table-row',
                  children: [
                    { type: 'table-cell', children: [{ text: 'Cell 1' }] },
                    { type: 'table-cell', children: [{ text: 'Cell 2' }] },
                  ],
                },
              ],
            };
            
            // Add logic to insert the table
          }}
        />
        <ToolbarButton 
          icon={<Sigma size={16} />} 
          tooltip="Insert Formula"
          onClick={insertMathBlock}
        />
      </div>

      <div className="h-6 w-px bg-gray-200 mx-1" />

      <div className="flex items-center space-x-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Palette size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Text Color</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-5 gap-1 p-1">
              {['#000000', '#5c6ac4', '#007d9c', '#d13438', '#0a8043'].map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {/* Add color logic */}}
                />
              ))}
            </div>
            <DropdownMenuLabel className="mt-2">Background</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-5 gap-1 p-1">
              {['#ffffff', '#f0f7ff', '#fff0f0', '#f0fff0', '#fffbf0'].map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform border border-gray-200"
                  style={{ backgroundColor: color }}
                  onClick={() => {/* Add background color logic */}}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <ToolbarButton 
          icon={<RotateCcw size={16} />} 
          tooltip="Undo"
          onClick={() => {/* Add undo logic */}}
        />
        <ToolbarButton 
          icon={<RotateCw size={16} />} 
          tooltip="Redo"
          onClick={() => {/* Add redo logic */}}
        />
      </div>
    </div>
  );
};

export default Toolbar;