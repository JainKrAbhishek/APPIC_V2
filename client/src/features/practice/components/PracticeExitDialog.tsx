import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";

interface PracticeExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExit: () => void;
}

const PracticeExitDialog: React.FC<PracticeExitDialogProps> = ({
  open,
  onOpenChange,
  onConfirmExit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden">
        <DialogHeader className="bg-[#404040] text-white p-4 relative">
          <DialogTitle className="text-base font-medium flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#F0B840]" />
            Exit to Practice Sets
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-3 text-white hover:bg-gray-700" 
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </Button>
        </DialogHeader>
        
        <div className="p-6">
          <p className="text-[#505050] text-sm leading-relaxed">
            Are you sure you want to return to the practice sets selection? Your progress and results will be saved.
          </p>
          
          <div className="mt-4 p-3 bg-[#FFF9E6] border border-[#F1C40F] rounded text-[#887512] text-xs">
            <p>
              <strong>Note:</strong> If you exit now, you will not be able to return to the questions in this section. You can only review your answers once you complete the entire section.
            </p>
          </div>
        </div>
        
        <DialogFooter className="px-4 py-3 bg-[#F5F5F5] border-t border-[#E0E0E0] flex justify-between sm:justify-between">
          <Button 
            variant="outline"
            className="border-[#C0C0C0] text-[#505050] hover:bg-[#E8E8E8] hover:text-[#333333]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className="bg-[#F44336] hover:bg-[#E53935] text-white"
            onClick={onConfirmExit}
          >
            Exit to Practice Sets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PracticeExitDialog;