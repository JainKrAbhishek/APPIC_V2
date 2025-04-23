import React from 'react';
import { RenderLeafProps } from 'slate-react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const EditorLeaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  if (leaf.strikethrough) {
    children = <s>{children}</s>;
  }

  if (leaf.highlight) {
    children = <mark className="bg-yellow-200 dark:bg-yellow-900">{children}</mark>;
  }

  if (leaf.code) {
    children = <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 font-mono text-sm">{children}</code>;
  }

  if (leaf.inlineMath) {
    children = (
      <span contentEditable={false} className="align-baseline">
        <InlineMath math={leaf.inlineMath} />
        {React.Children.only(children) as React.ReactElement}
      </span>
    );
  }

  if (leaf.link) {
    children = (
      <a 
        href={leaf.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {children}
      </a>
    );
  }

  let style: React.CSSProperties = {};

  if (leaf.color) style.color = leaf.color;
  if (leaf.backgroundColor) style.backgroundColor = leaf.backgroundColor;
  if (leaf.fontSize) style.fontSize = leaf.fontSize;

  return <span {...attributes} style={style}>{children}</span>;
};

export default EditorLeaf;