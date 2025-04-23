import { Editor, Transforms, Node, Range, Element as SlateElement, NodeEntry } from 'slate';
import { CustomElement } from '../types';

/**
 * Plugin that adds custom behaviors for certain element types
 */
export const withCustomElements = (editor: Editor): Editor => {
  const { isVoid, normalizeNode, insertBreak, deleteBackward } = editor;

  // Allow elements like images and formulas to be void
  editor.isVoid = (element) => {
    return (
      element.type === 'image' ||
      element.type === 'formula' ||
      element.type === 'horizontal-rule' ||
      isVoid(element)
    );
  };

  // Add normalize function to fix potential issues
  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    // Ensure there's always a paragraph at the end of the document
    if (path.length === 0) {
      const lastChild = node.children?.[node.children.length - 1];
      if (!lastChild || lastChild.type !== 'paragraph') {
        const paragraph: CustomElement = {
          type: 'paragraph',
          children: [{ text: '' }],
        };
        Transforms.insertNodes(editor, paragraph, {
          at: [node.children.length],
        });
      }
    }

    // Ensure each list-item is a child of a list
    if (SlateElement.isElement(node) && node.type === 'list-item') {
      const [parent] = Editor.parent(editor, path);
      if (
        !SlateElement.isElement(parent) ||
        (parent.type !== 'bulleted-list' && parent.type !== 'numbered-list')
      ) {
        Transforms.wrapNodes(
          editor,
          { type: 'bulleted-list', children: [] } as CustomElement,
          { at: path }
        );
        return;
      }
    }

    // Ensure table cells are always inside table rows
    if (SlateElement.isElement(node) && node.type === 'table-cell') {
      const [parent] = Editor.parent(editor, path);
      if (!SlateElement.isElement(parent) || parent.type !== 'table-row') {
        Transforms.wrapNodes(
          editor,
          { type: 'table-row', children: [] } as CustomElement,
          { at: path }
        );
        return;
      }
    }

    // Ensure table rows are always inside tables
    if (SlateElement.isElement(node) && node.type === 'table-row') {
      const [parent] = Editor.parent(editor, path);
      if (!SlateElement.isElement(parent) || parent.type !== 'table') {
        Transforms.wrapNodes(
          editor,
          { type: 'table', children: [] } as CustomElement,
          { at: path }
        );
        return;
      }
    }

    // Continue with the normal normalization
    normalizeNode(entry);
  };

  // Handle special cases when inserting a line break
  editor.insertBreak = () => {
    const { selection } = editor;
    if (!selection) {
      insertBreak();
      return;
    }

    // Get the block at the current selection
    const [block, path] = Editor.above(editor, {
      match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
    }) || [null, null];

    // Handle special blocks
    if (block && path) {
      // In a list item, split the list item
      if (block.type === 'list-item') {
        if (Node.string(block).length === 0) {
          // If the list item is empty, convert it to a paragraph
          Transforms.unwrapNodes(editor, {
            match: (n) =>
              SlateElement.isElement(n) &&
              (n.type === 'bulleted-list' || n.type === 'numbered-list'),
            split: true,
          });
          Transforms.setNodes(editor, { type: 'paragraph' });
          return;
        }
      }

      // In a code block, just insert a newline within the block
      if (block.type === 'code-block') {
        editor.insertText('\n');
        return;
      }
    }

    // Default behavior
    insertBreak();
  };

  // Handle special cases when pressing backspace
  editor.deleteBackward = (unit) => {
    const { selection } = editor;
    if (!selection || !Range.isCollapsed(selection)) {
      deleteBackward(unit);
      return;
    }

    // Check if we're at the start of a block
    const isAtStart = Editor.isStart(editor, selection.anchor, selection.anchor.path);
    if (!isAtStart) {
      deleteBackward(unit);
      return;
    }

    // Get the block at the current selection
    const [block, path] = Editor.above(editor, {
      match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
    }) || [null, null];

    if (block && path) {
      // Handle special block types
      if (
        block.type !== 'paragraph' &&
        block.type !== 'list-item' &&
        block.type !== 'table-cell'
      ) {
        // Convert the block to a paragraph
        Transforms.setNodes(editor, { type: 'paragraph' });
        return;
      }

      // Handle list items
      if (block.type === 'list-item') {
        const [parentList] = Editor.parent(editor, path);
        if (SlateElement.isElement(parentList) && 
            (parentList.type === 'bulleted-list' || parentList.type === 'numbered-list')) {
          // Unwrap the list item if it's empty
          if (Node.string(block).length === 0) {
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                SlateElement.isElement(n) &&
                (n.type === 'bulleted-list' || n.type === 'numbered-list'),
              split: true,
            });
            Transforms.setNodes(editor, { type: 'paragraph' });
            return;
          }
        }
      }
    }

    // Default behavior
    deleteBackward(unit);
  };

  return editor;
};