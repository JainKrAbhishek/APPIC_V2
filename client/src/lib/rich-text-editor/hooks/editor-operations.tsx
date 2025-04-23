import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Editor,
  Element as SlateElement,
  Transforms,
  Text,
  Range,
  Point,
  Node,
  Path,
  createEditor,
} from 'slate';
import { ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  CustomEditor, 
  CustomElement, 
  MarkFormat,
  ElementType, 
  Alignment,
  ImageElement,
  FormulaElement
} from '../types';
import { withCustomElements } from './with-custom-elements';

/**
 * Type for the editor operations context
 * Contains all operations that can be performed on the editor
 */
interface EditorOperationsContextType {
  isBlockActive: (format: string) => boolean;
  isAlignActive: (align: Alignment) => boolean;
  isMarkActive: (format: MarkFormat) => boolean;
  toggleBlock: (format: ElementType) => void;
  toggleMark: (format: MarkFormat) => void;
  setAlign: (align: Alignment) => void;
  addLink: (url: string) => void;
  removeLink: () => void;
  setTextColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  toggleCheckListItem: () => void;
  insertTable: (rows: number, cols: number) => void;
  insertHorizontalRule: () => void;
  insertFormula: (formula: string) => void;
  insertImage: (image: ImageElement) => void;
  undo: () => void;
  redo: () => void;
}

// Create a context for editor operations
const EditorOperationsContext = createContext<EditorOperationsContextType | null>(null);

/**
 * Provider component for editor operations
 */
export const EditorOperationsProvider: React.FC<{
  editor: CustomEditor;
  children: React.ReactNode;
}> = ({ editor, children }) => {
  /**
   * Check if a block format is currently active
   */
  const isBlockActive = useCallback(
    (format: string) => {
      const [match] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n.type === format,
      });
      return !!match;
    },
    [editor]
  );

  /**
   * Check if text alignment is currently active
   */
  const isAlignActive = useCallback(
    (align: Alignment) => {
      const [match] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n.align === align,
      });
      return !!match;
    },
    [editor]
  );

  /**
   * Check if a mark format is currently active
   */
  const isMarkActive = useCallback(
    (format: MarkFormat) => {
      const marks = Editor.marks(editor);
      return marks ? marks[format] === true : false;
    },
    [editor]
  );

  /**
   * Toggle a block format (like headings, lists, etc.)
   */
  const toggleBlock = useCallback(
    (format: ElementType) => {
      const isActive = isBlockActive(format);
      const isList = ['numbered-list', 'bulleted-list'].includes(format);

      // Unwrap any list first if it's a list item or we're toggling
      Transforms.unwrapNodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          ['numbered-list', 'bulleted-list'].includes(n.type),
        split: true,
      });

      // Set to default paragraph if we're toggling off or it's a different format
      let newProperties: Partial<SlateElement> = {
        type: isActive ? 'paragraph' : format,
      };

      if (!isActive && format === 'check-list-item') {
        // Add checked property for check lists
        newProperties = {
          ...newProperties,
          checked: false,
        };
      }

      Transforms.setNodes(editor, newProperties);

      // Wrap in list if needed
      if (!isActive && isList) {
        const block = { type: format, children: [] } as CustomElement;
        Transforms.wrapNodes(editor, block);
      }
    },
    [editor, isBlockActive]
  );

  /**
   * Toggle a mark format (like bold, italic, etc.)
   */
  const toggleMark = useCallback(
    (format: MarkFormat) => {
      const isActive = isMarkActive(format);

      if (isActive) {
        Editor.removeMark(editor, format);
      } else {
        Editor.addMark(editor, format, true);
      }
    },
    [editor, isMarkActive]
  );

  /**
   * Set text alignment
   */
  const setAlign = useCallback(
    (align: Alignment) => {
      Transforms.setNodes(
        editor,
        { align },
        {
          match: (n) =>
            !Editor.isEditor(n) && SlateElement.isElement(n) && Editor.isBlock(editor, n),
        }
      );
    },
    [editor]
  );

  /**
   * Add a link to selected text
   */
  const addLink = useCallback(
    (url: string) => {
      if (!url) return;

      const { selection } = editor;
      const isCollapsed = selection && Range.isCollapsed(selection);

      if (isCollapsed) {
        // If selection is collapsed, insert a new link node
        Transforms.insertNodes(editor, {
          type: 'paragraph',
          children: [{ text: url, link: url }],
        } as CustomElement);
      } else {
        // If selection is expanded, convert the selection to a link
        Transforms.setNodes(
          editor,
          { link: url } as Partial<Text>,
          { match: (n) => Text.isText(n), split: true }
        );
      }
    },
    [editor]
  );

  /**
   * Remove a link from selected text
   */
  const removeLink = useCallback(() => {
    Transforms.setNodes(
      editor,
      { link: null } as Partial<Text>,
      { match: (n) => Text.isText(n) && !!n.link, split: true }
    );
  }, [editor]);

  /**
   * Set text color
   */
  const setTextColor = useCallback(
    (color: string) => {
      Editor.addMark(editor, 'color', color);
    },
    [editor]
  );

  /**
   * Set background color
   */
  const setBackgroundColor = useCallback(
    (color: string) => {
      Editor.addMark(editor, 'backgroundColor', color);
    },
    [editor]
  );

  /**
   * Toggle a check list item
   */
  const toggleCheckListItem = useCallback(() => {
    const isActive = isBlockActive('check-list-item');

    if (isActive) {
      // Convert back to paragraph
      toggleBlock('paragraph');
    } else {
      // Convert to check list item
      Transforms.setNodes(
        editor,
        { type: 'check-list-item', checked: false } as Partial<CustomElement>,
        { match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
      );
    }
  }, [editor, isBlockActive, toggleBlock]);

  /**
   * Insert a table with specified rows and columns
   */
  const insertTable = useCallback(
    (rows: number, cols: number) => {
      // Create table cells for a row
      const createRow = (cellCount: number): CustomElement => {
        const cells = Array(cellCount)
          .fill(0)
          .map(() => ({
            type: 'table-cell',
            children: [{ type: 'paragraph', children: [{ text: '' }] }],
          }));

        return {
          type: 'table-row',
          children: cells,
        } as CustomElement;
      };

      // Create all rows
      const tableRows = Array(rows)
        .fill(0)
        .map(() => createRow(cols));

      // Create and insert the table
      const table: CustomElement = {
        type: 'table',
        children: tableRows,
      };

      Transforms.insertNodes(editor, table);
    },
    [editor]
  );

  /**
   * Insert a horizontal rule
   */
  const insertHorizontalRule = useCallback(() => {
    const rule: CustomElement = {
      type: 'horizontal-rule',
      children: [{ text: '' }],
    };

    Transforms.insertNodes(editor, rule);
    
    // Insert a paragraph after the rule for cursor positioning
    const paragraph: CustomElement = {
      type: 'paragraph',
      children: [{ text: '' }],
    };
    
    Transforms.insertNodes(editor, paragraph);
  }, [editor]);

  /**
   * Insert a math formula
   */
  const insertFormula = useCallback(
    (formula: string) => {
      const formulaElement: CustomElement = {
        type: 'formula',
        formula,
        children: [{ text: '' }],
      };

      Transforms.insertNodes(editor, formulaElement);
      
      // Insert a paragraph after the formula for cursor positioning
      const paragraph: CustomElement = {
        type: 'paragraph',
        children: [{ text: '' }],
      };
      
      Transforms.insertNodes(editor, paragraph);
    },
    [editor]
  );

  /**
   * Insert an image
   */
  const insertImage = useCallback(
    (image: ImageElement) => {
      const { url, alt, caption, imageAlign, size } = image;
      const imageElement: CustomElement = {
        type: 'image',
        url,
        alt: alt || '',
        caption: caption || undefined,
        imageAlign: imageAlign || 'center',
        size,
        children: [{ text: '' }],
      };

      Transforms.insertNodes(editor, imageElement);
      
      // Insert a paragraph after the image for cursor positioning
      const paragraph: CustomElement = {
        type: 'paragraph',
        children: [{ text: '' }],
      };
      
      Transforms.insertNodes(editor, paragraph);
    },
    [editor]
  );

  /**
   * Undo the last editor action
   */
  const undo = useCallback(() => {
    editor.undo();
  }, [editor]);

  /**
   * Redo the previously undone editor action
   */
  const redo = useCallback(() => {
    editor.redo();
  }, [editor]);

  return (
    <EditorOperationsContext.Provider
      value={{
        isBlockActive,
        isAlignActive,
        isMarkActive,
        toggleBlock,
        toggleMark,
        setAlign,
        addLink,
        removeLink,
        setTextColor,
        setBackgroundColor,
        toggleCheckListItem,
        insertTable,
        insertHorizontalRule,
        insertFormula,
        insertImage,
        undo,
        redo,
      }}
    >
      {children}
    </EditorOperationsContext.Provider>
  );
};

/**
 * Hook to use editor operations
 * Must be used within an EditorOperationsProvider
 */
export const useEditorOperations = (): EditorOperationsContextType => {
  const context = useContext(EditorOperationsContext);
  
  if (context === null) {
    throw new Error('useEditorOperations must be used within an EditorOperationsProvider');
  }
  
  return context;
};