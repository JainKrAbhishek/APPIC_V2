import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { ImportSuccessProps } from './types';

const ImportSuccess: React.FC<ImportSuccessProps> = ({
  importedCount,
  tabTitle,
  onReset
}) => {
  return (
    <Alert className="bg-green-50 border-green-200">
      <CheckCircle className="h-5 w-5 text-green-600" />
      <AlertTitle className="text-green-800">Import Successful</AlertTitle>
      <AlertDescription className="text-green-600">
        Successfully imported {importedCount} {tabTitle.toLowerCase()}.
      </AlertDescription>
      <div className="mt-4 flex space-x-2">
        <Button 
          size="sm" 
          onClick={onReset}
        >
          Import Another File
        </Button>
      </div>
    </Alert>
  );
};

export default ImportSuccess;