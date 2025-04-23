import React, { useState, useMemo, useCallback } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import 'katex/dist/katex.min.css';

import { RichTextEditorProps, CustomElement, CustomText } from './types';
import { withCustomElements } from './hooks';
import Element from './components/Element';
import Leaf from './components/Leaf';
import Toolbar from './components/Toolbar';

// Default initial value
const initialValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

/**
 * A rich text editor component with formatting toolbar
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue: propInitialValue,
  onChange,
  placeholder = 'Enter text here...',
  minHeight = '150px',
  readOnly = false,
}) => {
  // Initialize the editor with plugins
  const editor = useMemo(() => {
    const slateEditor = withCustomElements(withHistory(withReact(createEditor())));
    return slateEditor;
  }, []);

  // Use the provided initialValue or fall back to the default
  const [value, setValue] = useState<Descendant[]>(
    () => {
      try {
        // If an initialValue is provided as a string, try to parse it
        if (typeof propInitialValue === 'string') {
          const parsed = JSON.parse(propInitialValue);
          return parsed;
        }
        // Otherwise, use the provided initialValue directly or fall back to the default
        return propInitialValue || initialValue;
      } catch (error) {
        console.error('Failed to parse initialValue:', error);
        return initialValue;
      }
    }
  );

  // Define the change handler
  const handleChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue);
    if (onChange) {
      // If string output is expected, serialize the state to JSON
      if (typeof onChange === 'function') {
        onChange(newValue);
      }
    }
  }, [onChange]);

  // Define element and leaf renderers that convert between Slate and our component props
  const renderElement = useCallback((props: RenderElementProps) => {
    return <Element {...props as any} />;
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props as any} />;
  }, []);

  // Render the editor with toolbar
  return (
    <div className="rich-text-editor border border-gray-300 rounded-md overflow-hidden">
      <Slate 
        editor={editor} 
        initialValue={value}
        onChange={handleChange}
      >
        {!readOnly && <Toolbar />}
        <div 
          className="p-4"
          style={{ minHeight }}
        >
          <Editable
            readOnly={readOnly}
            placeholder={placeholder}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            spellCheck
            autoFocus={!readOnly}
            className="outline-none"
          />
        </div>
      </Slate>
    </div>
  );
};

// Export component and utilities
export default RichTextEditor;
export * from './types';
export * from './hooks';