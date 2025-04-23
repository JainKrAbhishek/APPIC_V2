import { useCallback } from 'react';
import { Editor, Transforms, Range, Node as SlateNode, Element as SlateElement, Text } from 'slate';
import { useSlate } from 'slate-react';
import { CustomElement, CustomText } from '../types';

/**
 * Custom hook for editor operations
 */
export function useEditorOperations() {
  const editor = useSlate();

  /**
   * Check if block with specified format is active
   */
  const isBlockActive = useCallback((format: string) => {
    const matches = Array.from(
      Editor.nodes(editor, {
        match: (n) => {
          // We need to cast n to CustomElement to access the type property
          return SlateElement.isElement(n) && (n as any).type === format;
        }
      })
    );
    return matches.length > 0;
  }, [editor]);

  /**
   * Check if alignment is active
   */
  const isAlignActive = useCallback((align: string) => {
    const matches = Array.from(
      Editor.nodes(editor, {
        match: (n) => {
          // We need to cast n to CustomElement to access the align property
          return SlateElement.isElement(n) && (n as any).align === align;
        }
      })
    );
    return matches.length > 0;
  }, [editor]);

  /**
   * Check if mark with specified format is active
   */
  const isMarkActive = useCallback((format: string) => {
    const marks = Editor.marks(editor);
    // Type-safe check for the format
    return marks ? marks[format as keyof Omit<CustomText, 'text'>] === true : false;
  }, [editor]);

  /**
   * Toggle block format
   */
  const toggleBlock = useCallback((format: string) => {
    const isActive = isBlockActive(format);
    const isList = format === 'bulleted-list' || format === 'numbered-list';

    Transforms.unwrapNodes(editor, {
      match: (n) => {
        return !Editor.isEditor(n) && 
               SlateElement.isElement(n) && 
               (['bulleted-list', 'numbered-list'].includes((n as any).type));
      },
      split: true,
    });

    Transforms.setNodes(editor, {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    } as Partial<CustomElement>);

    if (!isActive && isList) {
      const block = { type: format, children: [] };
      Transforms.wrapNodes(editor, block as CustomElement);
    }
  }, [editor, isBlockActive]);

  /**
   * Set node alignment
   */
  const setAlign = useCallback((align: 'left' | 'center' | 'right') => {
    Transforms.setNodes(editor, { align } as Partial<CustomElement>);
  }, [editor]);

  /**
   * Toggle mark format
   */
  const toggleMark = useCallback((format: string) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  }, [editor, isMarkActive]);

  /**
   * Set text color
   */
  const setTextColor = useCallback((color: string) => {
    Editor.addMark(editor, 'color', color);
  }, [editor]);

  /**
   * Set background color
   */
  const setBackgroundColor = useCallback((color: string) => {
    Editor.addMark(editor, 'backgroundColor', color);
  }, [editor]);

  /**
   * Insert link
   */
  const insertLink = useCallback((url?: string, text?: string) => {
    const linkUrl = url || prompt('Enter URL:');
    if (!linkUrl) return;
    
    if (editor.selection) {
      const isCollapsed = Range.isCollapsed(editor.selection);
      
      // If selection is collapsed, create a new link
      if (isCollapsed) {
        const linkText = text || prompt('Enter link text:') || linkUrl;
        const link = { text: linkText, link: linkUrl };
        Transforms.insertNodes(editor, link);
      } else {
        // Otherwise, wrap the selection with a link
        Editor.addMark(editor, 'link', linkUrl);
      }
    }
  }, [editor]);

  /**
   * Insert inline LaTeX formula
   */
  const insertInlineMath = useCallback((formula?: string) => {
    const mathFormula = formula || prompt('Enter LaTeX formula:');
    if (!mathFormula) return;
    
    if (editor.selection) {
      if (Range.isCollapsed(editor.selection)) {
        // Insert text with math mark
        const text = { text: 'TeX', inlineMath: mathFormula };
        Transforms.insertNodes(editor, text);
      } else {
        // Add math mark to selected text
        Editor.addMark(editor, 'inlineMath', mathFormula);
      }
    }
  }, [editor]);

  /**
   * Insert LaTeX formula block
   */
  const insertMathBlock = useCallback((formula?: string) => {
    const mathFormula = formula;
    
    if (mathFormula) {
      // Insert a math block
      const mathNode = {
        type: 'math',
        formula: mathFormula,
        children: [{ text: '' }]
      };
      Transforms.insertNodes(editor, mathNode as CustomElement);
    }
  }, [editor]);

  /**
   * Insert image
   */
  const insertImage = useCallback((options: {
    url: string;
    alt?: string;
    caption?: string;
    imageAlign?: 'left' | 'center' | 'right';
    size?: { width: string; height: string };
  }) => {
    if (!options.url) return;

    // Insert image node
    const imageNode = {
      type: 'image',
      url: options.url,
      alt: options.alt || '',
      caption: options.caption || '',
      imageAlign: options.imageAlign || 'center',
      size: options.size || { width: '50%', height: 'auto' },
      children: [{ text: '' }]
    };
    
    Transforms.insertNodes(editor, imageNode as CustomElement);
  }, [editor]);

  /**
   * Insert table
   */
  const insertTable = useCallback((rows: number = 2, cols: number = 2) => {
    // Create header row
    const headerRow = {
      type: 'table-row',
      children: Array(cols).fill(0).map((_, i) => ({
        type: 'table-header',
        children: [{ text: `Header ${i + 1}` }]
      }))
    };

    // Create data rows
    const dataRows = Array(rows - 1).fill(0).map((_, i) => ({
      type: 'table-row',
      children: Array(cols).fill(0).map((_, j) => ({
        type: 'table-cell',
        children: [{ text: `Cell ${i + 1}-${j + 1}` }]
      }))
    }));

    // Create table node
    const tableNode = {
      type: 'table',
      children: [headerRow, ...dataRows]
    };

    Transforms.insertNodes(editor, tableNode as CustomElement);
  }, [editor]);

  /**
   * Insert horizontal rule
   */
  const insertHorizontalRule = useCallback(() => {
    const hrNode = {
      type: 'horizontal-rule',
      children: [{ text: '' }]
    };
    
    Transforms.insertNodes(editor, hrNode as CustomElement);
  }, [editor]);

  /**
   * Insert code block
   */
  const insertCodeBlock = useCallback(() => {
    const codeNode = {
      type: 'code-block',
      children: [{ text: '' }]
    };
    
    Transforms.insertNodes(editor, codeNode as CustomElement);
  }, [editor]);

  /**
   * Insert check list item
   */
  const insertCheckListItem = useCallback(() => {
    toggleBlock('check-list-item');
  }, [toggleBlock]);
  
  /**
   * Toggle check list item state
   */
  const toggleCheckListItem = useCallback((path: number[]) => {
    if (!editor || !path) return;
    
    try {
      const node = SlateNode.get(editor, path) as CustomElement;
      
      if (node && node.type === 'check-list-item') {
        Transforms.setNodes(
          editor,
          { checked: !node.checked } as Partial<CustomElement>,
          { at: path }
        );
      }
    } catch (error) {
      console.error('Error toggling check list item:', error);
    }
  }, [editor]);

  /**
   * Get the current selection's node and path
   */
  const getSelectedNode = useCallback(() => {
    if (!editor.selection) return null;
    
    const [node, path] = Editor.node(editor, editor.selection);
    return { node, path };
  }, [editor]);

  /**
   * Undo the last change
   */
  const undo = useCallback(() => {
    editor.undo();
  }, [editor]);

  /**
   * Redo the last undone change
   */
  const redo = useCallback(() => {
    editor.redo();
  }, [editor]);

  /**
   * Remove link from selected text
   */
  const removeLink = useCallback(() => {
    if (!editor.selection) return;
    
    try {
      Transforms.setNodes(
        editor,
        { link: undefined } as Partial<CustomText>,
        { match: (n) => Text.isText(n) && n.link !== undefined, split: true }
      );
    } catch (error) {
      console.error('Error removing link:', error);
    }
  }, [editor]);

  return {
    isBlockActive,
    isAlignActive,
    isMarkActive,
    toggleBlock,
    setAlign,
    toggleMark,
    setTextColor,
    setBackgroundColor,
    insertLink,
    removeLink,
    insertInlineMath,
    insertMathBlock,
    insertImage,
    insertTable,
    insertHorizontalRule,
    insertCodeBlock,
    insertCheckListItem,
    toggleCheckListItem,
    getSelectedNode,
    undo,
    redo
  };
}