import React from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { CustomText } from '../types';

/**
 * Component to render formatted text in the editor
 * This handles all inline formatting like bold, italic, etc.
 */
const Leaf: React.FC<{
  attributes: any;
  children: React.ReactNode;
  leaf: CustomText;
}> = ({ attributes, children, leaf }) => {
  // Apply all text formatting properties
  let element = <>{children}</>;

  // Apply styling based on the leaf properties
  if (leaf.bold) {
    element = <strong>{element}</strong>;
  }

  if (leaf.italic) {
    element = <em>{element}</em>;
  }

  if (leaf.underline) {
    element = <u>{element}</u>;
  }

  if (leaf.strikethrough) {
    element = <del>{element}</del>;
  }

  if (leaf.code) {
    element = <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{element}</code>;
  }

  if (leaf.highlight) {
    element = <mark className="bg-yellow-200 dark:bg-yellow-700">{element}</mark>;
  }

  if (leaf.superscript) {
    element = <sup>{element}</sup>;
  }

  if (leaf.subscript) {
    element = <sub>{element}</sub>;
  }

  // Handle inline KaTeX formula
  if (leaf.inlineMath) {
    element = (
      <span className="inline-block" contentEditable={false}>
        <InlineMath math={leaf.inlineMath} />
        {element}
      </span>
    );
  }

  // Handle links
  if (leaf.link) {
    element = (
      <a 
        href={leaf.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary underline hover:text-primary/80"
      >
        {element}
      </a>
    );
  }

  // Apply color and background styling
  const style: React.CSSProperties = {};
  
  if (leaf.color) {
    style.color = leaf.color;
  }
  
  if (leaf.backgroundColor) {
    style.backgroundColor = leaf.backgroundColor;
  }
  
  if (leaf.fontSize) {
    style.fontSize = leaf.fontSize;
  }

  return (
    <span 
      {...attributes} 
      style={Object.keys(style).length ? style : undefined}
    >
      {element}
    </span>
  );
};

export default Leaf;