import React from 'react';
import { RenderElementProps } from 'slate-react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { CustomElement } from './types';

const EditorElement = ({ attributes, children, element }: RenderElementProps) => {
  const style = { textAlign: element.align };
  
  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote
          style={style}
          className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 text-gray-700 dark:text-gray-300 italic"
          {...attributes}
        >
          {children}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul style={style} className="list-disc list-inside my-2" {...attributes}>
          {children}
        </ul>
      );
    case 'heading-one':
      return (
        <h1 style={style} className="text-3xl font-bold my-3" {...attributes}>
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 style={style} className="text-2xl font-bold my-2" {...attributes}>
          {children}
        </h2>
      );
    case 'heading-three':
      return (
        <h3 style={style} className="text-xl font-bold my-2" {...attributes}>
          {children}
        </h3>
      );
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      );
    case 'numbered-list':
      return (
        <ol style={style} className="list-decimal list-inside my-2" {...attributes}>
          {children}
        </ol>
      );
    case 'math':
      return (
        <div
          {...attributes}
          className="py-2 flex justify-center items-center"
          contentEditable={false}
        >
          <div className="select-none">{children}</div>
          {element.formula && (
            <div className="tex-formula">
              <BlockMath math={element.formula} />
            </div>
          )}
        </div>
      );
    case 'image':
      const { url, alt, caption, imageAlign, size } = element as CustomElement;
      
      // Define alignment style based on imageAlign property
      let alignClass = 'mx-auto'; // Default center alignment
      if (imageAlign === 'left') alignClass = 'ml-0 mr-auto';
      if (imageAlign === 'right') alignClass = 'ml-auto mr-0';
      
      return (
        <div {...attributes} contentEditable={false} className={`my-4 ${alignClass}`}>
          <div className="select-none">{children}</div>
          <div>
            <img
              src={url}
              alt={alt || ''}
              className="rounded-md"
              style={size ? { width: size.width, height: size.height } : { maxWidth: '100%' }}
            />
            {caption && (
              <p className="text-center text-sm text-gray-500 mt-1">{caption}</p>
            )}
          </div>
        </div>
      );
    default:
      return (
        <p style={style} className="my-1" {...attributes}>
          {children}
        </p>
      );
  }
};

export default EditorElement;