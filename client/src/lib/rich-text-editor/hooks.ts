import { useCallback } from 'react';
import { Editor, Transforms, Range, Node as SlateNode, Element as SlateElement } from 'slate';
import { useSlate } from 'slate-react';
import { CustomElement, CustomText } from './types';

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
   * Insert link
   */
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

  /**
   * Insert inline LaTeX formula
   */
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

  /**
   * Insert LaTeX formula block
   */
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
              <button class="latex-btn px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-symbol="\\alpha">\\alpha</button>
              <button class="latex-btn px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-symbol="\\beta">\\beta</button>
              <button class="latex-btn px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" data-symbol="\\pi">\\pi</button>
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
    
    // Import katex only when needed
    import('katex').then(katex => {
      // Update preview function
      const updatePreview = () => {
        if (formulaPreview) {
          try {
            formulaPreview.innerHTML = katex.default.renderToString(formulaInput.value, { 
              throwOnError: false,
              displayMode: true
            });
          } catch (error) {
            formulaPreview.innerHTML = '<span class="text-red-500">LaTeX syntax error</span>';
          }
        }
      };
      
      // Update preview as user types
      formulaInput.addEventListener('input', updatePreview);
      
      // Add LaTeX symbol buttons functionality
      latexBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const symbol = (e.currentTarget as HTMLElement).getAttribute('data-symbol');
          if (symbol) {
            // Get cursor position
            const start = formulaInput.selectionStart || 0;
            const end = formulaInput.selectionEnd || 0;
            
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
      
      // Initial preview (in case there's a default value)
      updatePreview();
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
        const formula = formulaInput.value;
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
    formulaInput.focus();
  }, [editor]);

  /**
   * Insert image
   */
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
        <label class="block text-sm font-medium text-gray-700 mb-2">Caption (optional):</label>
        <input id="image-caption-input" class="w-full border rounded-md px-3 py-2" placeholder="Image caption" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Size:</label>
        <div class="flex gap-2">
          <button id="size-small" class="px-3 py-1 border rounded hover:bg-gray-100">Small</button>
          <button id="size-medium" class="px-3 py-1 border rounded hover:bg-gray-100">Medium</button>
          <button id="size-large" class="px-3 py-1 border rounded hover:bg-gray-100">Full Width</button>
        </div>
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
    const captionInput = document.getElementById('image-caption-input') as HTMLInputElement;
    const previewArea = document.getElementById('image-preview');
    const cancelBtn = document.getElementById('cancel-btn');
    const insertBtn = document.getElementById('insert-btn');
    
    // Size buttons
    const sizeSmall = document.getElementById('size-small');
    const sizeMedium = document.getElementById('size-medium');
    const sizeLarge = document.getElementById('size-large');
    
    // Alignment buttons
    const alignLeft = document.getElementById('align-left');
    const alignCenter = document.getElementById('align-center');
    const alignRight = document.getElementById('align-right');
    
    // Default values
    let selectedSize = { width: '50%', height: 'auto' }; // Default medium
    let selectedAlign = 'center'; // Default center
    
    // Set initial active states
    sizeMedium?.classList.add('bg-blue-100', 'border-blue-500');
    alignCenter?.classList.add('bg-blue-100', 'border-blue-500');
    
    // Size button handlers
    sizeSmall?.addEventListener('click', () => {
      selectedSize = { width: '30%', height: 'auto' };
      
      // Update active state
      [sizeSmall, sizeMedium, sizeLarge].forEach(btn => {
        btn?.classList.remove('bg-blue-100', 'border-blue-500');
      });
      sizeSmall?.classList.add('bg-blue-100', 'border-blue-500');
      
      updatePreview();
    });
    
    sizeMedium?.addEventListener('click', () => {
      selectedSize = { width: '50%', height: 'auto' };
      
      // Update active state
      [sizeSmall, sizeMedium, sizeLarge].forEach(btn => {
        btn?.classList.remove('bg-blue-100', 'border-blue-500');
      });
      sizeMedium?.classList.add('bg-blue-100', 'border-blue-500');
      
      updatePreview();
    });
    
    sizeLarge?.addEventListener('click', () => {
      selectedSize = { width: '100%', height: 'auto' };
      
      // Update active state
      [sizeSmall, sizeMedium, sizeLarge].forEach(btn => {
        btn?.classList.remove('bg-blue-100', 'border-blue-500');
      });
      sizeLarge?.classList.add('bg-blue-100', 'border-blue-500');
      
      updatePreview();
    });
    
    // Alignment button handlers
    alignLeft?.addEventListener('click', () => {
      selectedAlign = 'left';
      
      // Update active state
      [alignLeft, alignCenter, alignRight].forEach(btn => {
        btn?.classList.remove('bg-blue-100', 'border-blue-500');
      });
      alignLeft?.classList.add('bg-blue-100', 'border-blue-500');
      
      updatePreview();
    });
    
    alignCenter?.addEventListener('click', () => {
      selectedAlign = 'center';
      
      // Update active state
      [alignLeft, alignCenter, alignRight].forEach(btn => {
        btn?.classList.remove('bg-blue-100', 'border-blue-500');
      });
      alignCenter?.classList.add('bg-blue-100', 'border-blue-500');
      
      updatePreview();
    });
    
    alignRight?.addEventListener('click', () => {
      selectedAlign = 'right';
      
      // Update active state
      [alignLeft, alignCenter, alignRight].forEach(btn => {
        btn?.classList.remove('bg-blue-100', 'border-blue-500');
      });
      alignRight?.classList.add('bg-blue-100', 'border-blue-500');
      
      updatePreview();
    });
    
    // Update the preview when URL changes
    function updatePreview() {
      if (!previewArea) return;
      
      const url = urlInput.value.trim();
      if (!url) {
        previewArea.innerHTML = '<span class="text-gray-500">Image preview will appear here</span>';
        return;
      }
      
      const alignStyle = selectedAlign === 'center' 
        ? 'margin-left: auto; margin-right: auto; display: block;' 
        : selectedAlign === 'right' 
          ? 'float: right; margin-left: 10px;' 
          : 'float: left; margin-right: 10px;';
      
      const imgHtml = `
        <figure style="text-align: ${selectedAlign};">
          <img 
            src="${url}" 
            alt="${altInput.value || 'Image'}" 
            style="width: ${selectedSize.width}; height: ${selectedSize.height}; ${alignStyle}" 
            onerror="this.onerror=null;this.src='';this.alt='Error loading image';this.style.border='1px solid red';this.style.padding='20px';this.style.boxSizing='border-box';"
          />
          ${captionInput.value ? `<figcaption class="text-sm text-gray-500 mt-1">${captionInput.value}</figcaption>` : ''}
        </figure>
      `;
      
      previewArea.innerHTML = imgHtml;
    }
    
    // URL input handler
    urlInput.addEventListener('input', updatePreview);
    captionInput.addEventListener('input', updatePreview);
    
    // Handle close/cancel
    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
    
    // Handle ESC key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // Handle insert
    insertBtn?.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (url) {
        // Insert an image node
        const imageNode = {
          type: 'image',
          url,
          alt: altInput.value,
          caption: captionInput.value,
          imageAlign: selectedAlign as 'left' | 'center' | 'right',
          size: selectedSize,
          children: [{ text: '' }]
        };
        Transforms.insertNodes(editor, imageNode as CustomElement);
      }
      document.body.removeChild(modalContainer);
    });
  }, [editor]);

  return {
    isBlockActive,
    isAlignActive,
    isMarkActive,
    toggleBlock,
    setAlign,
    toggleMark,
    insertLink,
    insertInlineMath,
    insertMathBlock,
    insertImage
  };
}

/**
 * Initialize custom elements for the editor
 */
export const withCustomElements = (editor: any) => {
  const { isInline, isVoid } = editor;

  editor.isInline = (element: any) => {
    return element.type === 'link' || isInline(element);
  };

  editor.isVoid = (element: any) => {
    return ['image', 'math'].includes(element.type) || isVoid(element);
  };

  return editor;
};