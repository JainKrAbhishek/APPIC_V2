import React, { useState, useCallback, useMemo } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { withCustomElements } from './hooks/with-custom-elements';
import { EditorOperationsProvider } from './hooks/editor-operations.tsx';
import EditorToolbar from './EditorToolbar';
import Element from './components/Element';
import Leaf from './components/Leaf';
import './editor.css';

// Default initial value for an empty editor
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

interface EnhancedEditorProps {
  value?: Descendant[];
  onChange?: (value: Descendant[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
}

/**
 * The main enhanced rich text editor component
 * Combines all editor features and components
 */
const EnhancedEditor: React.FC<EnhancedEditorProps> = ({
  value = initialValue,
  onChange,
  placeholder = 'Type something...',
  readOnly = false,
  minHeight = '200px',
  className = '',
}) => {
  // Create a Slate editor instance that won't change across renders
  const editor = useMemo(() => {
    return withCustomElements(withHistory(withReact(createEditor())));
  }, []);

  // State for the editor value
  const [editorValue, setEditorValue] = useState<Descendant[]>(value);

  // Handle value changes
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      setEditorValue(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  // Define keyboard handlers
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Add any global keyboard shortcuts here
      // For example, Tab key handling in code blocks or lists
    },
    []
  );

  // Define rendering functions
  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  return (
    <div className={`enhanced-editor ${className}`}>
      <EditorOperationsProvider editor={editor}>
        <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
          {!readOnly && <EditorToolbar />}
          <div
            className={`border border-gray-200 dark:border-gray-800 rounded-md p-4 bg-white dark:bg-gray-950 ${
              readOnly ? 'opacity-90' : ''
            }`}
            style={{ minHeight }}
          >
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder={placeholder}
              spellCheck
              autoFocus
              readOnly={readOnly}
              onKeyDown={handleKeyDown}
              className="outline-none min-h-full prose prose-sm dark:prose-invert max-w-none"
            />
          </div>
        </Slate>
      </EditorOperationsProvider>
    </div>
  );
};

export default EnhancedEditor;