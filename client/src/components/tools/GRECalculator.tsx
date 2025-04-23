import React, { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GRECalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const GRECalculator: React.FC<GRECalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Clear the calculator
  const clearAll = () => {
    setDisplay('0');
    setMemory(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  // Clear the current entry
  const clearEntry = () => {
    setDisplay('0');
    setWaitingForOperand(false);
  };

  // Input a digit
  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  // Input a decimal point
  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  // Toggle the sign (positive/negative)
  const toggleSign = () => {
    const newValue = parseFloat(display) * -1;
    setDisplay(String(newValue));
  };

  // Calculate percentage
  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  // Calculate square root
  const squareRoot = () => {
    const value = parseFloat(display);
    if (value >= 0) {
      setDisplay(String(Math.sqrt(value)));
      addToHistory(`√(${value}) = ${Math.sqrt(value)}`);
    } else {
      setDisplay('Error');
    }
  };

  // Calculate square
  const square = () => {
    const value = parseFloat(display);
    setDisplay(String(value * value));
    addToHistory(`${value}² = ${value * value}`);
  };

  // Handle basic operations (add, subtract, multiply, divide)
  const handleOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);
    
    if (memory === null) {
      setMemory(inputValue);
    } else if (operation) {
      const currentValue = memory || 0;
      let result = 0;
      
      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = currentValue / inputValue;
          break;
        default:
          break;
      }
      
      setMemory(result);
      setDisplay(String(result));
      addToHistory(`${currentValue} ${operation} ${inputValue} = ${result}`);
    }
    
    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  // Calculate the result
  const handleEquals = () => {
    if (!operation || memory === null) return;
    
    const inputValue = parseFloat(display);
    let result = 0;
    
    switch (operation) {
      case '+':
        result = memory + inputValue;
        break;
      case '-':
        result = memory - inputValue;
        break;
      case '×':
        result = memory * inputValue;
        break;
      case '÷':
        result = memory / inputValue;
        break;
      default:
        break;
    }
    
    setDisplay(String(result));
    addToHistory(`${memory} ${operation} ${inputValue} = ${result}`);
    setMemory(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  // Add to calculation history
  const addToHistory = (calculation: string) => {
    setHistory([...history.slice(-9), calculation]);
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="bg-[#404040] text-white p-4 flex justify-between items-center">
          <DialogTitle className="text-base font-medium flex items-center gap-2">
            GRE® Calculator
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-7 h-7 p-0 rounded-full hover:bg-gray-700 text-white"
            onClick={onClose}
          >
            <X size={14} />
          </Button>
        </DialogHeader>
        
        <div className="p-4 bg-[#F5F5F5] shadow-inner">
          <Input
            value={display}
            readOnly
            className="text-right text-xl font-medium mb-2 p-3 h-12 bg-white"
          />
          
          <div className="grid grid-cols-4 gap-2 mt-3">
            {/* Memory and Clear Buttons */}
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={clearAll}>C</Button>
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={clearEntry}>CE</Button>
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={() => setDisplay(display.slice(0, -1) || '0')}>
              <ArrowLeft size={14} />
            </Button>
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={() => handleOperation('÷')}>÷</Button>
            
            {/* Digits and Operations */}
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('7')}>7</Button>
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('8')}>8</Button>
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('9')}>9</Button>
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={() => handleOperation('×')}>×</Button>
            
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('4')}>4</Button>
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('5')}>5</Button>
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('6')}>6</Button>
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={() => handleOperation('-')}>-</Button>
            
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('1')}>1</Button>
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('2')}>2</Button>
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('3')}>3</Button>
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={() => handleOperation('+')}>+</Button>
            
            <Button variant="outline" className="bg-white" onClick={toggleSign}>+/-</Button>
            <Button variant="outline" className="bg-white" onClick={() => inputDigit('0')}>0</Button>
            <Button variant="outline" className="bg-white" onClick={inputDot}>.</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEquals}>=</Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={percentage}>%</Button>
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={squareRoot}>√</Button>
            <Button variant="outline" className="bg-white text-sm text-gray-600" onClick={square}>x²</Button>
          </div>
        </div>
        
        {/* History section */}
        {history.length > 0 && (
          <div className="border-t border-gray-200 p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">History</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-gray-500"
                onClick={clearHistory}
              >
                Clear
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto text-sm">
              {history.map((calculation, index) => (
                <div key={index} className="py-1 text-gray-600">
                  {calculation}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GRECalculator;