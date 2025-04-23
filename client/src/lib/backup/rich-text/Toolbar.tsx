import React, { useCallback } from 'react';
import { Editor, Element as SlateElement, Transforms, Range } from 'slate';
import { useSlate } from 'slate-react';
import { 
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  Quote, List, ListOrdered, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Link, Code, 
  Sigma
} from 'lucide-react';
import ToolbarButton from './ToolbarButton';
import { CustomElement } from './types';
import katex from 'katex';

const Toolbar = () => {
  const editor = useSlate();

  // Check if block with specified format is active
  const isBlockActive = (format: string) => {
    const [match] = Array.from(
      Editor.nodes(editor, {
        match: n => n.type === format,
      })
    );
    return !!match;
  };

  // Check if alignment is active
  const isAlignActive = (align: string) => {
    const [match] = Array.from(
      Editor.nodes(editor, {
        match: n => n.align === align,
      })
    );
    return !!match;
  };

  // Check if mark with specified format is active
  const isMarkActive = (format: string) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };

  // Toggle block format
  const toggleBlock = (format: string) => {
    const isActive = isBlockActive(format);
    const isList = format === 'bulleted-list' || format === 'numbered-list';

    Transforms.unwrapNodes(editor, {
      match: n => ['bulleted-list', 'numbered-list'].includes(n.type as string),
      split: true,
    });

    Transforms.setNodes(editor, {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    } as Partial<CustomElement>);

    if (!isActive && isList) {
      const block = { type: format, children: [] };
      Transforms.wrapNodes(editor, block as CustomElement);
    }
  };

  // Set node alignment
  const setAlign = (align: 'left' | 'center' | 'right') => {
    Transforms.setNodes(editor, { align } as Partial<CustomElement>);
  };

  // Toggle mark format
  const toggleMark = (format: string) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  // Insert link
  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (!url) return;
    
    if (editor.selection) {
      const isCollapsed = Range.isCollapsed(editor.selection);
      
      // If selection is collapsed, create a new link
      if (isCollapsed) {
        const text = prompt('Enter link text:') || url;
        const link = { text, link: url };
        Transforms.insertNodes(editor, link);
      } else {
        // Otherwise, wrap the selection with a link
        Editor.addMark(editor, 'link', url);
      }
    }
  }, [editor]);
  
  // Insert inline LaTeX formula
  const insertInlineMath = useCallback(() => {
    const formula = prompt('Enter LaTeX formula:');
    if (!formula) return;
    
    if (editor.selection) {
      if (Range.isCollapsed(editor.selection)) {
        // Insert text with math mark
        const text = { text: 'TeX', inlineMath: formula };
        Transforms.insertNodes(editor, text);
      } else {
        // Add math mark to selected text
        Editor.addMark(editor, 'inlineMath', formula);
      }
    }
  }, [editor]);

  // Insert LaTeX formula block
  const insertMathBlock = useCallback(() => {
    // Create custom modal dialog for LaTeX entry
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl max-w-xl w-full p-6';
    modalContent.innerHTML = `
      <h3 class="text-xl font-semibold mb-4">Insert LaTeX Formula</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Enter LaTeX formula:</label>
          <textarea id="formula-input" class="w-full border rounded-md px-3 py-2 h-40 font-mono" placeholder="e.g., \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"></textarea>
          
          <div class="mt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Common LaTeX Symbols:</h4>
            <div class="grid grid-cols-3 gap-2 text-sm">
              <button class="latex-btn px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-symbol="\\frac{a}{b}">\\frac{a}{b}</button>
              <button class="latex-btn px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-symbol="\\sqrt{x}">\\sqrt{x}</button>
              <button class="latex-btn px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-symbol="\\sum_{i=1}^{n}">\\sum_{i=1}^{n}</button>
              <button class="latex-btn px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-symbol="\\int_{a}^{b}">\\int_{a}^{b}</button>
              <button class="latex-btn px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-symbol="\\lim_{x \\to 0}">\\lim_{x \\to 0}</button>
              <button class="latex-btn px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-symbol="\\theta">\\theta</button>
            </div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Formula Preview:</label>
          <div id="formula-preview" class="p-4 bg-gray-50 rounded-md h-full min-h-[200px] flex items-center justify-center">
            <span class="text-gray-400">Formula preview will appear here</span>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-2 mt-6">
        <button id="cancel-btn" class="px-4 py-2 border rounded-md hover:bg-gray-100">Cancel</button>
        <button id="insert-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Insert</button>
      </div>
    `;
    
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);
    
    // Get references to elements
    const formulaInput = document.getElementById('formula-input') as HTMLTextAreaElement;
    const formulaPreview = document.getElementById('formula-preview');
    const cancelBtn = document.getElementById('cancel-btn');
    const insertBtn = document.getElementById('insert-btn');
    const latexBtns = document.querySelectorAll('.latex-btn');
    
    // Update preview function
    const updatePreview = () => {
      if (formulaPreview) {
        try {
          formulaPreview.innerHTML = katex.renderToString(formulaInput.value, { 
            throwOnError: false,
            displayMode: true
          });
        } catch (error) {
          formulaPreview.innerHTML = '<span class="text-red-500">LaTeX syntax error</span>';
        }
      }
    };
    
    // Update preview as user types
    formulaInput?.addEventListener('input', updatePreview);
    
    // Add LaTeX symbol buttons functionality
    latexBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const symbol = (e.currentTarget as HTMLElement).getAttribute('data-symbol');
        if (symbol && formulaInput) {
          // Get cursor position
          const start = formulaInput.selectionStart;
          const end = formulaInput.selectionEnd;
          
          // Insert symbol at cursor
          formulaInput.value = 
            formulaInput.value.substring(0, start) + 
            symbol + 
            formulaInput.value.substring(end);
          
          // Set new cursor position after the inserted symbol
          formulaInput.selectionStart = start + symbol.length;
          formulaInput.selectionEnd = start + symbol.length;
          
          // Update preview
          updatePreview();
          
          // Focus back on textarea
          formulaInput.focus();
        }
      });
    });
    
    // Handle close/cancel
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
      });
    }
    
    // Handle ESC key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // Handle insert
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        const formula = formulaInput?.value;
        if (formula) {
          // Insert a math block
          const mathNode = {
            type: 'math',
            formula,
            children: [{ text: '' }]
          };
          Transforms.insertNodes(editor, mathNode as CustomElement);
        }
        document.body.removeChild(modalContainer);
      });
    }
    
    // Focus the input field
    formulaInput?.focus();
    
    // Initial preview (in case there's a default value)
    updatePreview();
  }, [editor]);

  // Insert image
  const insertImage = useCallback(() => {
    // Create custom modal dialog for image insertion
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl max-w-lg w-full p-6';
    modalContent.innerHTML = `
      <h3 class="text-xl font-semibold mb-4">Insert Image</h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Image URL:</label>
        <input id="image-url-input" class="w-full border rounded-md px-3 py-2" placeholder="https://example.com/image.jpg" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Alt Text (for accessibility):</label>
        <input id="image-alt-input" class="w-full border rounded-md px-3 py-2" placeholder="Description of the image" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Alignment:</label>
        <div class="flex gap-2">
          <button id="align-left" class="px-3 py-1 border rounded hover:bg-gray-100">Left</button>
          <button id="align-center" class="px-3 py-1 border rounded hover:bg-gray-100">Center</button>
          <button id="align-right" class="px-3 py-1 border rounded hover:bg-gray-100">Right</button>
        </div>
      </div>
      <div id="image-preview" class="p-4 bg-gray-50 rounded-md mb-4 min-h-[100px] flex items-center justify-center">
        <span class="text-gray-500">Image preview will appear here</span>
      </div>
      <div class="flex justify-end gap-2">
        <button id="cancel-btn" class="px-4 py-2 border rounded-md hover:bg-gray-100">Cancel</button>
        <button id="insert-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Insert</button>
      </div>
    `;
    
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);
    
    // Get references to elements
    const urlInput = document.getElementById('image-url-input') as HTMLInputElement;
    const altInput = document.getElementById('image-alt-input') as HTMLInputElement;
    const previewArea = document.getElementById('image-preview');
    const cancelBtn = document.getElementById('cancel-btn');
    const insertBtn = document.getElementById('insert-btn');
    
    // Alignment buttons
    const alignLeft = document.getElementById('align-left');
    const alignCenter = document.getElementById('align-center');
    const alignRight = document.getElementById('align-right');
    
    // Default values
    let selectedAlign = 'center'; // Default center
    
    // Update preview when URL changes
    urlInput?.addEventListener('input', () => {
      if (previewArea) {
        if (urlInput.value.trim()) {
          previewArea.innerHTML = `<img src="${urlInput.value}" class="max-h-[150px] max-w-full object-contain" />`;
        } else {
          previewArea.innerHTML = `<span class="text-gray-500">Image preview will appear here</span>`;
        }
      }
    });
    
    // Set up alignment selection
    const selectAlign = (align: string) => {
      selectedAlign = align;
      
      // Update UI to show selected button
      [alignLeft, alignCenter, alignRight].forEach(btn => {
        btn?.classList.remove('bg-blue-50', 'border-blue-200', 'text-blue-700');
      });
      
      if (align === 'left' && alignLeft) {
        alignLeft.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-700');
      } else if (align === 'center' && alignCenter) {
        alignCenter.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-700');
      } else if (align === 'right' && alignRight) {
        alignRight.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-700');
      }
    };
    
    // Initialize with center alignment selected
    selectAlign('center');
    
    // Add alignment button click handlers
    alignLeft?.addEventListener('click', () => selectAlign('left'));
    alignCenter?.addEventListener('click', () => selectAlign('center'));
    alignRight?.addEventListener('click', () => selectAlign('right'));
    
    // Handle cancel button click
    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
    
    // Handle ESC key press
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // Handle insert button click
    insertBtn?.addEventListener('click', () => {
      const url = urlInput?.value;
      if (url) {
        const imageNode = {
          type: 'image',
          url,
          alt: altInput?.value || '',
          imageAlign: selectedAlign as 'left' | 'center' | 'right',
          children: [{ text: '' }],
        };
        Transforms.insertNodes(editor, imageNode as CustomElement);
        document.body.removeChild(modalContainer);
      }
    });
    
    // Focus URL input on open
    urlInput?.focus();
  }, [editor]);

  return (
    <div className="flex items-center flex-wrap gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1 mb-2 bg-white dark:bg-gray-800">
      <ToolbarButton 
        icon={<Bold size={16} />} 
        tooltip="Bold (Ctrl+B)" 
        active={isMarkActive('bold')} 
        onClick={() => toggleMark('bold')} 
      />
      <ToolbarButton 
        icon={<Italic size={16} />} 
        tooltip="Italic (Ctrl+I)" 
        active={isMarkActive('italic')} 
        onClick={() => toggleMark('italic')} 
      />
      <ToolbarButton 
        icon={<Underline size={16} />} 
        tooltip="Underline (Ctrl+U)" 
        active={isMarkActive('underline')} 
        onClick={() => toggleMark('underline')} 
      />
      <ToolbarButton 
        icon={<Code size={16} />} 
        tooltip="Code" 
        active={isMarkActive('code')} 
        onClick={() => toggleMark('code')} 
      />
      
      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
      
      <ToolbarButton 
        icon={<Heading1 size={16} />} 
        tooltip="Heading 1" 
        active={isBlockActive('heading-one')} 
        onClick={() => toggleBlock('heading-one')} 
      />
      <ToolbarButton 
        icon={<Heading2 size={16} />} 
        tooltip="Heading 2" 
        active={isBlockActive('heading-two')} 
        onClick={() => toggleBlock('heading-two')} 
      />
      <ToolbarButton 
        icon={<Heading3 size={16} />} 
        tooltip="Heading 3" 
        active={isBlockActive('heading-three')} 
        onClick={() => toggleBlock('heading-three')} 
      />
      
      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
      
      <ToolbarButton 
        icon={<List size={16} />} 
        tooltip="Bullet List" 
        active={isBlockActive('bulleted-list')} 
        onClick={() => toggleBlock('bulleted-list')} 
      />
      <ToolbarButton 
        icon={<ListOrdered size={16} />} 
        tooltip="Numbered List" 
        active={isBlockActive('numbered-list')} 
        onClick={() => toggleBlock('numbered-list')} 
      />
      <ToolbarButton 
        icon={<Quote size={16} />} 
        tooltip="Block Quote" 
        active={isBlockActive('block-quote')} 
        onClick={() => toggleBlock('block-quote')} 
      />
      
      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
      
      <ToolbarButton 
        icon={<AlignLeft size={16} />} 
        tooltip="Align Left" 
        active={isAlignActive('left')} 
        onClick={() => setAlign('left')} 
      />
      <ToolbarButton 
        icon={<AlignCenter size={16} />} 
        tooltip="Align Center" 
        active={isAlignActive('center')} 
        onClick={() => setAlign('center')} 
      />
      <ToolbarButton 
        icon={<AlignRight size={16} />} 
        tooltip="Align Right" 
        active={isAlignActive('right')} 
        onClick={() => setAlign('right')} 
      />
      
      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
      
      <ToolbarButton 
        icon={<Link size={16} />} 
        tooltip="Insert Link" 
        onClick={insertLink} 
      />
      <ToolbarButton 
        icon={<ImageIcon size={16} />} 
        tooltip="Insert Image" 
        onClick={insertImage} 
      />
      <ToolbarButton 
        icon={<Sigma size={16} />} 
        tooltip="Insert Math Formula" 
        onClick={insertMathBlock} 
      />
    </div>
  );
};

export default Toolbar;