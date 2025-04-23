import React from 'react';
import { Descendant } from 'slate';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { RichTextContent, ExtendedDescendant } from './types';

/**
 * Checks if rich text content is empty
 * Improved detection that handles various edge cases properly
 */
export const isRichTextEmpty = (content: RichTextContent | null | undefined): boolean => {
  if (!content) return true;
  if (!Array.isArray(content)) return true;
  if (content.length === 0) return true;
  
  // Check if all nodes are empty
  return content.every(node => {
    const extNode = node as ExtendedDescendant;
    
    // Check text nodes
    if (extNode.text !== undefined) {
      return extNode.text.trim() === '';
    }
    
    // Check element nodes
    if (extNode.type && extNode.children) {
      // Special handling for void elements
      if (['image', 'formula', 'divider'].includes(extNode.type)) {
        return false; // These aren't empty even with empty children
      }
      
      // Check children for text content
      return isRichTextEmpty(extNode.children as RichTextContent);
    }
    
    return true; // Default to empty if structure is unknown
  });
};

/**
 * Safely retrieves text content from a node
 */
export const getNodeText = (node: any): string => {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  if (!node.children || !Array.isArray(node.children)) return '';
  
  return node.children
    .map((child: any) => getNodeText(child))
    .join('');
};

interface RichTextContentRendererProps {
  content: RichTextContent;
}

/**
 * A component that renders rich text content from the editor
 * This handles all element types in a consistent way
 */
export const RichTextContentRenderer: React.FC<RichTextContentRendererProps> = ({ content }) => {
  if (isRichTextEmpty(content)) {
    return <div className="text-muted-foreground">No content available</div>;
  }
  
  const renderNode = (node: Descendant, index: number): React.ReactNode => {
    const extNode = node as ExtendedDescendant;
    
    // Handle text nodes (no type property)
    if (extNode.text !== undefined) {
      let textContent = extNode.text;
      
      // Apply text formatting
      const style: React.CSSProperties = {
        fontWeight: extNode.bold ? 'bold' : undefined,
        fontStyle: extNode.italic ? 'italic' : undefined,
        textDecoration: extNode.underline ? 'underline' : undefined,
        textDecorationLine: extNode.strikethrough ? 'line-through' : undefined,
        backgroundColor: extNode.highlight ? 'yellow' : (extNode.backgroundColor || undefined),
        color: extNode.color || undefined,
        fontFamily: extNode.code ? 'monospace' : undefined,
      };
      
      // Handle inline math
      if (extNode.inlineMath) {
        return (
          <span key={index} style={style}>
            <InlineMath math={extNode.inlineMath} />
          </span>
        );
      }
      
      // Handle links
      if (extNode.link) {
        return (
          <a 
            key={index} 
            href={extNode.link} 
            target="_blank" 
            rel="noopener noreferrer"
            style={style}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {textContent}
          </a>
        );
      }
      
      // Regular text
      return <span key={index} style={style}>{textContent}</span>;
    }
    
    // Handle element nodes
    if (extNode.type && extNode.children) {
      const children = extNode.children.map(renderNode);
      
      switch (extNode.type) {
        case 'paragraph':
          return <p key={index} className="my-2">{children}</p>;
          
        case 'heading-one':
          return <h1 key={index} className="text-3xl font-bold my-3">{children}</h1>;
          
        case 'heading-two':
          return <h2 key={index} className="text-2xl font-bold my-3">{children}</h2>;
          
        case 'heading-three':
          return <h3 key={index} className="text-xl font-bold my-2">{children}</h3>;
          
        case 'bulleted-list':
          return <ul key={index} className="list-disc pl-5 my-3">{children}</ul>;
          
        case 'numbered-list':
          return <ol key={index} className="list-decimal pl-5 my-3">{children}</ol>;
          
        case 'list-item':
          return <li key={index} className="my-1">{children}</li>;
          
        case 'block-quote':
          return (
            <blockquote key={index} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-3 italic">
              {children}
            </blockquote>
          );
          
        case 'code-block':
          return (
            <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md my-3 font-mono text-sm overflow-x-auto">
              <code>{children}</code>
            </pre>
          );
          
        case 'formula':
          return (
            <div key={index} className="my-3 text-center">
              <BlockMath math={extNode.formula || ''} />
            </div>
          );
          
        case 'image':
          return (
            <figure key={index} className={`my-4 ${extNode.imageAlign === 'center' ? 'mx-auto' : ''}`}>
              <img 
                src={extNode.url} 
                alt={extNode.alt || 'Image'} 
                style={{
                  maxWidth: '100%',
                  marginLeft: extNode.imageAlign === 'left' ? '0' : 
                              extNode.imageAlign === 'right' ? 'auto' : 'auto',
                  marginRight: extNode.imageAlign === 'right' ? '0' : 
                               extNode.imageAlign === 'left' ? 'auto' : 'auto',
                  ...((extNode.size?.width || extNode.size?.height) ? {
                    width: extNode.size?.width,
                    height: extNode.size?.height,
                  } : {})
                }}
              />
              {extNode.caption && (
                <figcaption className="text-center text-sm mt-2 text-gray-600 dark:text-gray-400">
                  {extNode.caption}
                </figcaption>
              )}
            </figure>
          );
          
        case 'divider':
          return <hr key={index} className="my-4 border-t border-gray-300 dark:border-gray-700" />;
          
        case 'text-completion-blank':
          return (
            <span key={index} className="inline-block mx-1 px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
              {children.length ? children : <span>_______</span>}
            </span>
          );
          
        default:
          console.warn(`Unknown element type: ${extNode.type}`);
          return <div key={index}>{children}</div>;
      }
    }
    
    // Fallback for unknown content
    return <span key={index}>Unknown content</span>;
  };
  
  return (
    <div className="rich-text-rendered-content">
      {Array.isArray(content) ? content.map(renderNode) : null}
    </div>
  );
};

export default RichTextContentRenderer;