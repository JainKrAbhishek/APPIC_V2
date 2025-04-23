import { BaseEditor, Descendant } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

// Define the types of elements that can be in the editor
export type ElementType =
  | 'paragraph'
  | 'heading-one'
  | 'heading-two'
  | 'heading-three'
  | 'block-quote'
  | 'bulleted-list'
  | 'numbered-list'
  | 'list-item'
  | 'check-list-item'
  | 'image'
  | 'formula'
  | 'table'
  | 'table-row'
  | 'table-cell'
  | 'code-block'
  | 'horizontal-rule'
  // Legacy element types for backward compatibility
  | 'unorderedList'
  | 'orderedList'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify';

// Define the custom element structure
export interface CustomElement {
  type: ElementType;
  children: CustomText[];
  url?: string;
  alt?: string;
  caption?: string;
  formula?: string;
  checked?: boolean;
  imageAlign?: 'left' | 'center' | 'right';
  size?: { width: string; height: string };
  align?: 'left' | 'center' | 'right';
}

// Define the custom text structure with formatting options
export interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  highlight?: boolean;
  code?: boolean;
  inlineMath?: string;
  link?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  superscript?: boolean;
  subscript?: boolean;
}

// Extend the Slate editor types
export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

// Add custom types to the Slate TypeScript definitions
declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Define the alignment options
export type Alignment = 'left' | 'center' | 'right';

// Interface for the image properties
export interface ImageElement {
  url: string;
  alt?: string;
  caption?: string;
  imageAlign?: Alignment;
  size?: { width: string; height: string };
}

// Interface for the formula properties
export interface FormulaElement {
  formula: string;
}

// Define the format types for marks (inline formatting)
export type MarkFormat =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'highlight'
  | 'code'
  | 'inlineMath'
  | 'link'
  | 'color'
  | 'backgroundColor'
  | 'fontSize'
  | 'superscript'
  | 'subscript';

// RichTextEditor Props definition
export type RichTextEditorProps = {
  initialValue?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
};

// Default initial value for the editor
export const initialValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];