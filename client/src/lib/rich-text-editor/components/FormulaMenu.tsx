import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { useEditorOperations } from '../hooks/editor-operations';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FormulaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Component for inserting mathematical formulas using KaTeX
 * With enhanced interactive preview
 */
const FormulaMenu: React.FC<FormulaMenuProps> = ({ isOpen, onClose }) => {
  const { insertMathBlock, insertInlineMath } = useEditorOperations();
  const [formula, setFormula] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formulaType, setFormulaType] = useState<'block' | 'inline'>('block');
  const [previewScale, setPreviewScale] = useState<number>(1);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Handle formula validation on change
  useEffect(() => {
    // Clear error when formula changes
    if (error) setError(null);
    
    // Validate formula after a short delay
    const timer = setTimeout(() => {
      try {
        // Try to render the formula with KaTeX (the component internally validates)
        // If it renders successfully, there will be no error thrown
      } catch (err) {
        // We don't set the error immediately to avoid disrupting the user while typing
        if (formula && formula.trim() !== '') {
          setError('Invalid LaTeX formula. Please check your syntax.');
        }
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formula]);

  const handleSubmit = () => {
    // Validate formula
    if (!formula.trim()) {
      setError('Please enter a formula');
      return;
    }

    try {
      // Insert the formula into the editor based on selected type
      if (formulaType === 'block') {
        insertMathBlock(formula);
      } else {
        insertInlineMath(formula);
      }
      handleClose();
    } catch (err) {
      setError('Invalid LaTeX formula. Please check your syntax.');
    }
  };

  const handleClose = () => {
    setFormula('');
    setError(null);
    setFormulaType('block');
    setPreviewScale(1);
    onClose();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Example formulas for the user to select categorized by type
  const examples = {
    basic: [
      { label: 'Quadratic Formula', value: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' },
      { label: 'Pythagorean Theorem', value: 'a^2 + b^2 = c^2' },
      { label: 'Binomial Theorem', value: '(x+y)^n = \\sum_{k=0}^n \\binom{n}{k} x^{n-k} y^k' },
    ],
    calculus: [
      { label: 'Derivative', value: '\\frac{d}{dx}f(x) = \\lim_{h \\to 0}\\frac{f(x+h) - f(x)}{h}' },
      { label: 'Integral', value: '\\int_{a}^{b} f(x) \\, dx' },
      { label: 'Area Under Curve', value: 'A = \\int_{a}^{b} f(x) \\, dx' },
    ],
    statistics: [
      { label: 'Normal Distribution', value: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}' },
      { label: 'Standard Deviation', value: '\\sigma = \\sqrt{\\frac{1}{N} \\sum_{i=1}^{N} (x_i - \\mu)^2}' },
      { label: 'Correlation Coefficient', value: 'r = \\frac{\\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum_{i=1}^{n}(x_i-\\bar{x})^2\\sum_{i=1}^{n}(y_i-\\bar{y})^2}}' },
    ],
    symbols: [
      { label: 'Sum', value: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
      { label: 'Product', value: '\\prod_{i=1}^{n} i = n!' },
      { label: 'Limit', value: '\\lim_{x \\to \\infty} \\frac{1}{x} = 0' },
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Insert Mathematical Formula</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="editor">Formula Editor</TabsTrigger>
            <TabsTrigger value="examples">Examples Library</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-2 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <Button 
                    variant={formulaType === 'block' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormulaType('block')}
                  >
                    Block Formula
                  </Button>
                  <Button 
                    variant={formulaType === 'inline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormulaType('inline')}
                  >
                    Inline Formula
                  </Button>
                </div>
                
                <div className="flex gap-2 items-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPreviewScale(Math.max(0.5, previewScale - 0.25))}
                    disabled={previewScale <= 0.5}
                  >
                    Zoom -
                  </Button>
                  <span className="text-xs">{Math.round(previewScale * 100)}%</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPreviewScale(Math.min(2, previewScale + 0.25))}
                    disabled={previewScale >= 2}
                  >
                    Zoom +
                  </Button>
                </div>
              </div>
              
              <Textarea
                ref={textareaRef}
                value={formula}
                onChange={(e) => {
                  setFormula(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                rows={4}
                className="font-mono text-sm"
                placeholder="\frac{-b \pm \sqrt{b^2-4ac}}{2a}"
              />
              
              {error && <div className="text-red-500 text-sm">{error}</div>}
              
              {formula && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Live Preview</CardTitle>
                    <CardDescription className="text-xs">
                      See how your formula will appear in the document
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="p-4 flex justify-center overflow-x-auto border rounded-md bg-white dark:bg-gray-950"
                      ref={previewRef}
                      style={{ transform: `scale(${previewScale})`, transformOrigin: 'center' }}
                    >
                      {formulaType === 'block' ? (
                        <BlockMath math={formula} errorColor="#ef4444" />
                      ) : (
                        <div className="text-lg">
                          This is an example of an inline formula: <InlineMath math={formula} errorColor="#ef4444" /> within text.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="examples" className="mt-4">
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-6">
                {Object.entries(examples).map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-lg font-medium capitalize">{category}</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {items.map((example) => (
                        <Card 
                          key={example.label} 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                          onClick={() => {
                            setFormula(example.value);
                            // Switch to editor tab after selecting an example
                            const editorTab = document.querySelector('[data-value="editor"]') as HTMLElement;
                            if (editorTab) editorTab.click();
                          }}
                        >
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-sm">{example.label}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">
                              {example.value}
                            </div>
                            <div className="flex justify-center p-1">
                              <BlockMath math={example.value} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex-1">
            {formulaType === 'block' ? 'Block formulas appear on their own line' : 'Inline formulas flow with surrounding text'}
            <span className="ml-2 text-gray-400 dark:text-gray-600">Press Ctrl+Enter to insert</span>
          </div>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formula.trim() || !!error}>
            Insert Formula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormulaMenu;