import React, { useCallback, useMemo } from 'react';
import { Descendant, createEditor } from 'slate';
import { Slate, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import EnhancedEditor from './EnhancedEditor';
import { EditorOperationsProvider } from './hooks/editor-operations.tsx';
import { withCustomElements } from './hooks/with-custom-elements';
import './editor.css';

// Default initial value for the editor when empty
const INITIAL_VALUE: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

interface RichTextEditorIntegrationProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
}

export const RichTextEditorIntegration: React.FC<RichTextEditorIntegrationProps> = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  minHeight = '200px',
  className = '',
}) => {
  // Create editor instance
  const editor = useMemo(() => {
    return withCustomElements(withHistory(withReact(createEditor())));
  }, []);

  // Ensure valid initial value
  const editorValue = useMemo(() => {
    if (!value || !Array.isArray(value)) {
      console.log('Invalid editor value, using initial value');
      return INITIAL_VALUE;
    }
    return value;
  }, [value]);

  // Handle content changes
  const handleChange = useCallback((newValue: Descendant[]) => {
    const isContentChange = editor.operations.some(op => op.type !== 'set_selection');
    if (isContentChange) {
      onChange(newValue);
    }
  }, [editor, onChange]);

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <EditorOperationsProvider editor={editor}>
        <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
          <EnhancedEditor
            placeholder={placeholder}
            readOnly={readOnly}
            minHeight={minHeight}
          />
        </Slate>
      </EditorOperationsProvider>
    </div>
  );
};