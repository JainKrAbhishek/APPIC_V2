import React from 'react';
import { RichTextEditor as EnhancedRichTextEditor, RichTextEditorProps } from '@/lib/rich-text-editor';

/**
 * Rich Text Editor component
 * 
 * This is a wrapper around the enhanced rich text editor component
 * to maintain compatibility with existing code.
 */
const RichTextEditor: React.FC<RichTextEditorProps> = (props) => {
  return <EnhancedRichTextEditor {...props} />;
};

// Export as both default and named export to maintain compatibility
export { RichTextEditor };
export default RichTextEditor;