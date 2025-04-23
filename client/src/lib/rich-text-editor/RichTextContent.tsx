import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { withCustomElements } from './hooks/with-custom-elements';
import Element from './components/Element';
import Leaf from './components/Leaf';
import './editor.css';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, FileText, Clock } from 'lucide-react';

// Default initial value for the editor when empty
const INITIAL_VALUE: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

interface RichTextContentProps {
  content: string | Descendant[];
  className?: string;
  isEditing?: boolean;
  emptyMessage?: string;
  showReadingStats?: boolean;
  transformContent?: (content: React.ReactNode) => React.ReactNode;
}

/**
 * Enhanced Rich Text Content display component
 * 
 * This component renders rich text content in a read-only view with improved
 * parsing and error handling. It supports both Slate format and database format
 * content, and provides graceful fallbacks for parsing errors.
 */
export const RichTextContent: React.FC<RichTextContentProps> = ({
  content,
  className = '',
  isEditing = false,
  emptyMessage = 'No content available',
  showReadingStats = false,
  transformContent,
}) => {
  const [wordCount, setWordCount] = useState<number>(0);
  const [readTime, setReadTime] = useState<number>(0);
  const [renderError, setRenderError] = useState<Error | null>(null);

  // Parse the content and prepare it for rendering
  const initialValue = useMemo(() => {
    try {
      console.log('RichTextContent: Processing content', { 
        contentType: typeof content, 
        isArray: Array.isArray(content),
        contentLength: Array.isArray(content) ? content.length : (typeof content === 'string' ? content.length : 'n/a')
      });

      // Case 1: No content provided at all
      if (content === null || content === undefined) {
        console.debug('RichTextContent: Empty content provided');
        return INITIAL_VALUE;
      }

      // Case 2: Content is already in Slate format (array of nodes)
      if (Array.isArray(content)) {
        // If array is empty, use initial value
        if (content.length === 0) {
          return INITIAL_VALUE;
        }
        
        // Check if array contains valid Slate nodes
        const hasValidNodes = content.some(node => 
          node && typeof node === 'object' && 'type' in node && 'children' in node
        );
        
        // If valid, use it directly
        if (hasValidNodes) {
          console.debug('RichTextContent: Valid array content', { 
            length: content.length, 
            sample: content[0] 
          });
          return content;
        } else {
          console.debug('RichTextContent: Invalid array format, using default');
          return INITIAL_VALUE;
        }
      }

      // Case 3: Content is a string that needs to be parsed
      if (typeof content === 'string') {
        // Handle empty string
        if (!content.trim()) {
          return INITIAL_VALUE;
        }
        
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(content);
          
          // Case 3a: String parsed into Slate format array
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasValidNodes = parsed.some(node => 
              node && typeof node === 'object' && 'type' in node && 'children' in node
            );
            
            if (hasValidNodes) {
              console.debug('RichTextContent: Valid parsed array content', { length: parsed.length });
              return parsed;
            }
          }
          
          // Case 3b: Database content format
          if (parsed && typeof parsed === 'object' && parsed.type === 'content' && Array.isArray(parsed.blocks)) {
            // Convert database format to Slate format
            const slateContent = parsed.blocks.map((block: any) => {
              // Handle text blocks
              if (block.data && typeof block.data.text === 'string') {
                const blockType = 
                  block.type === 'heading-one' || 
                  block.type === 'heading-two' || 
                  block.type === 'heading-three' ? 
                    block.type : 
                  block.type === 'quote' ? 
                    'block-quote' : 
                  block.type === 'code' ? 
                    'code-block' : 
                    'paragraph';
                
                return {
                  type: blockType,
                  children: [{ text: block.data.text || '' }]
                };
              }
              
              // Handle lists
              if (block.type === 'list' && block.data && Array.isArray(block.data.items)) {
                return {
                  type: block.data.style === 'ordered' ? 'numbered-list' : 'bulleted-list',
                  children: block.data.items.map((item: string) => ({
                    type: 'list-item',
                    children: [{ text: item || '' }]
                  }))
                };
              }
              
              // Handle image blocks
              if (block.type === 'image' && block.data) {
                return {
                  type: 'image',
                  url: block.data.url || '',
                  alt: block.data.alt || '',
                  caption: block.data.caption || '',
                  imageAlign: block.data.align || 'center',
                  children: [{ text: '' }]
                };
              }
              
              // Handle formula blocks
              if (block.type === 'formula' && block.data) {
                return {
                  type: 'formula',
                  formula: block.data.formula || '',
                  children: [{ text: '' }]
                };
              }
              
              // Default case
              return {
                type: 'paragraph',
                children: [{ text: block.data?.text || '' }]
              };
            });
            
            // Return converted content or default if empty
            return slateContent.length > 0 ? slateContent : INITIAL_VALUE;
          }
        } catch (e) {
          console.warn('RichTextContent: Failed to parse content string', e);
          // Continue with default value
          return INITIAL_VALUE;
        }
      }

      // Default case: unknown content format
      console.warn('RichTextContent: Unknown content format', { 
        contentType: typeof content 
      });
      return INITIAL_VALUE;
    } catch (e) {
      console.error('RichTextContent: Error processing content', e);
      setRenderError(e as Error);
      return INITIAL_VALUE;
    }
  }, [content]);

  // Create editor instance
  const editor = useMemo(() => {
    return withCustomElements(withHistory(withReact(createEditor())));
  }, []);

  // Define rendering functions
  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  // Calculate reading stats
  useEffect(() => {
    if (showReadingStats) {
      try {
        let textContent = '';
        
        // Extract text from all nodes
        const extractText = (nodes: any[]) => {
          if (!Array.isArray(nodes)) return;
          
          nodes.forEach(node => {
            if (!node) return;
            
            if ('text' in node) {
              textContent += node.text + ' ';
            } else if (node.children) {
              extractText(node.children);
            }
          });
        };
        
        // Start extraction
        extractText(initialValue);
        
        // Calculate statistics
        const words = textContent.trim().split(/\s+/).filter(Boolean).length;
        const wpm = 200; // Average reading speed
        const minutes = Math.max(1, Math.ceil(words / wpm));
        
        setWordCount(words);
        setReadTime(minutes);
      } catch (e) {
        console.error('Error calculating reading stats:', e);
        setWordCount(0);
        setReadTime(0);
      }
    }
  }, [initialValue, showReadingStats]);

  // Show error message if parsing failed
  if (renderError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error displaying content</AlertTitle>
        <AlertDescription>
          There was a problem rendering the content. Please try refreshing or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  // Create the slate editor content
  const editorContent = useMemo(() => (
    <Slate editor={editor} initialValue={initialValue} onChange={() => {}}>
      <Editable
        readOnly
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        className="enhanced-editor read-only"
      />
    </Slate>
  ), [editor, initialValue, renderElement, renderLeaf]);
  
  // Apply content transformation if provided
  const displayContent = transformContent ? transformContent(editorContent) : editorContent;
  
  return (
    <div className={`rich-text-content ${className}`}>
      {showReadingStats && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
          <span className="flex items-center gap-1" title="Word count">
            <FileText className="h-3 w-3" />
            {wordCount} words
          </span>
          <span className="flex items-center gap-1" title="Reading time">
            <Clock className="h-3 w-3" />
            {readTime} min read
          </span>
        </div>
      )}
      {displayContent}
    </div>
  );
};