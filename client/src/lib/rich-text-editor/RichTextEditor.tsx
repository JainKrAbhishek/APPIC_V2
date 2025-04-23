import React, { useState, useMemo, useCallback } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { RichTextEditorProps, initialValue } from './types';
import Toolbar from './components/Toolbar';
import Element from './components/Element';
import Leaf from './components/Leaf';
import { withCustomElements } from './hooks/with-custom-elements';
import './editor.css';

/**
 * Enhanced Rich Text Editor component with full formatting capabilities
 * 
 * This component provides a complete rich text editing experience with formatting toolbar,
 * multiple block types, and support for mathematical formulas and images.
 */
export const RichTextEditor = ({ 
  initialValue: externalInitialValue,
  onChange,
  placeholder = 'Type your content here...',
  minHeight = '250px',
  readOnly = false
}: RichTextEditorProps) => {
  // Create editor instance with plugins
  const editor = useMemo(() => withCustomElements(withHistory(withReact(createEditor()))), []);
  
  // State to track content value
  const [value, setValue] = useState<Descendant[]>(externalInitialValue || initialValue);
  
  // Define render element function
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  
  // Define render leaf function
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  
  // Handle value change
  const handleChange = (newValue: Descendant[]) => {
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };
  
  return (
    <div className="rich-text-editor">
      <Slate
        editor={editor}
        initialValue={value}
        onChange={handleChange}
      >
        {!readOnly && <Toolbar />}
        <div 
          className={`${readOnly ? '' : 'border border-gray-200 dark:border-gray-700'} rounded-md p-3 bg-white dark:bg-gray-800 relative overflow-auto enhanced-editor`}
          style={{ minHeight }}
        >
          <Editable
            readOnly={readOnly}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder={placeholder}
            spellCheck
            className="outline-none min-h-full"
            onKeyDown={(event) => {
              // Keyboard shortcuts for formatting
              if (!readOnly) {
                // Bold: Ctrl+B
                if (event.ctrlKey && event.key === 'b') {
                  event.preventDefault();
                  const isBold = editor.marks ? editor.marks.bold === true : false;
                  if (isBold) {
                    editor.removeMark('bold');
                  } else {
                    editor.addMark('bold', true);
                  }
                }
                // Italic: Ctrl+I
                if (event.ctrlKey && event.key === 'i') {
                  event.preventDefault();
                  const isItalic = editor.marks ? editor.marks.italic === true : false;
                  if (isItalic) {
                    editor.removeMark('italic');
                  } else {
                    editor.addMark('italic', true);
                  }
                }
                // Underline: Ctrl+U
                if (event.ctrlKey && event.key === 'u') {
                  event.preventDefault();
                  const isUnderline = editor.marks ? editor.marks.underline === true : false;
                  if (isUnderline) {
                    editor.removeMark('underline');
                  } else {
                    editor.addMark('underline', true);
                  }
                }
              }
            }}
          />
        </div>
      </Slate>
    </div>
  );
};

export default RichTextEditor;
