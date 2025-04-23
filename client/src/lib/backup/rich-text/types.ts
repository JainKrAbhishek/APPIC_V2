import { BaseEditor } from 'slate';
import { ReactEditor } from 'slate-react';

// Define custom element types
export type CustomElement = {
  type: string;
  children: CustomText[];
  formula?: string;
  url?: string;
  alt?: string;
  caption?: string;
  imageAlign?: 'left' | 'center' | 'right';
  align?: 'left' | 'center' | 'right';
  size?: { width: string; height: string };
};

export type CustomText = {
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
};

// Extend the slate type definitions
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Types
export type RichTextEditorProps = {
  initialValue?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
};

// Default initial value
export const initialValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];