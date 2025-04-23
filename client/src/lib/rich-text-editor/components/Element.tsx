import React from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { CustomElement } from '../types';

/**
 * Component to render different types of elements in the editor
 * This handles block-level elements like paragraphs, headings, lists, etc.
 */
const Element: React.FC<{
  attributes: any;
  children: React.ReactNode;
  element: CustomElement;
}> = ({ attributes, children, element }) => {
  // Special case for handling legacy types that might not be in our ElementType definition
  const elementType = element.type as string;

  // Apply different components based on element type
  switch (elementType) {
    case 'paragraph':
      return <p {...attributes}>{children}</p>;
    
    case 'heading-one':
      return <h1 className="text-3xl font-bold mt-6 mb-4" {...attributes}>{children}</h1>;
    
    case 'heading-two':
      return <h2 className="text-2xl font-bold mt-5 mb-3" {...attributes}>{children}</h2>;
    
    case 'heading-three':
      return <h3 className="text-xl font-bold mt-4 mb-2" {...attributes}>{children}</h3>;
    
    case 'bulleted-list':
      return <ul className="list-disc pl-10 my-4" {...attributes}>{children}</ul>;
    
    case 'numbered-list':
      return <ol className="list-decimal pl-10 my-4" {...attributes}>{children}</ol>;
    
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    
    // Handle unorderedList and orderedList types (legacy types)
    case 'unorderedList':
      // Use div wrapper to avoid DOM nesting validation errors (ul inside p)
      return (
        <div className="list-wrapper" {...attributes}>
          <div className="my-4">
            <ul className="list-disc pl-10">{children}</ul>
          </div>
        </div>
      );
    
    case 'orderedList':
      // Use div wrapper to avoid DOM nesting validation errors (ol inside p)
      return (
        <div className="list-wrapper" {...attributes}>
          <div className="my-4">
            <ol className="list-decimal pl-10">{children}</ol>
          </div>
        </div>
      );
    
    case 'block-quote':
      return (
        <blockquote 
          className="border-l-4 border-gray-300 pl-4 py-1 my-4 italic" 
          {...attributes}
        >
          {children}
        </blockquote>
      );
    
    case 'code-block':
      return (
        <pre 
          className="bg-gray-100 dark:bg-gray-800 rounded p-4 overflow-x-auto my-4 font-mono text-sm"
          {...attributes}
        >
          <code>{children}</code>
        </pre>
      );
    
    case 'horizontal-rule':
      return (
        <div {...attributes}>
          <div contentEditable={false}>
            <hr className="my-4 border-gray-300 dark:border-gray-600" />
          </div>
          {children}
        </div>
      );
    
    case 'image':
      const { url, alt, caption, imageAlign = 'center', size } = element;
      
      // Set alignment classes
      const alignClasses = {
        left: 'float-left mr-4 mb-2',
        center: 'mx-auto block',
        right: 'float-right ml-4 mb-2',
      };
      
      // Create component with image and optional caption
      return (
        <div 
          {...attributes}
          className={`my-4 ${imageAlign === 'center' ? 'text-center' : ''}`}
        >
          <div contentEditable={false}>
            <img
              src={url}
              alt={alt || 'Image'}
              className={`rounded-md ${alignClasses[imageAlign as keyof typeof alignClasses]}`}
              style={size ? { width: size.width, height: size.height } : {}}
            />
            {caption && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                {caption}
              </p>
            )}
          </div>
          {children}
        </div>
      );
    
    case 'formula':
      const { formula } = element;
      return (
        <div {...attributes}>
          <div contentEditable={false} className="py-2 flex justify-center">
            <BlockMath math={formula || ''} />
          </div>
          {children}
        </div>
      );
    
    case 'table':
      return (
        <div className="my-4 overflow-x-auto" {...attributes}>
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
            <tbody>{children}</tbody>
          </table>
        </div>
      );
    
    case 'table-row':
      return <tr className="border-b border-gray-300 dark:border-gray-700" {...attributes}>{children}</tr>;
    
    case 'table-cell':
      return (
        <td 
          className="border border-gray-300 dark:border-gray-700 px-4 py-2" 
          {...attributes}
        >
          {children}
        </td>
      );

    case 'check-list-item':
      // Create checklist with custom style
      return (
        <div 
          className="flex items-start my-2" 
          {...attributes}
        >
          <div contentEditable={false} className="mr-2 mt-1">
            <input 
              type="checkbox" 
              checked={element.checked || false}
              readOnly 
              className="h-4 w-4 rounded"
            />
          </div>
          <div className="flex-1">{children}</div>
        </div>
      );
    
    // Handle text alignment blocks
    case 'align-left':
      return <div {...attributes} className="text-left">{children}</div>;
    
    case 'align-center':
      return <div {...attributes} className="text-center">{children}</div>;
    
    case 'align-right':
      return <div {...attributes} className="text-right">{children}</div>;
    
    case 'align-justify':
      return <div {...attributes} className="text-justify">{children}</div>;

    // Default case for any other elements
    default:
      return <p {...attributes}>{children}</p>;
  }
};

export default Element;