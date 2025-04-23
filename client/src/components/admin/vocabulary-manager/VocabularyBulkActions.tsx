import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Plus } from "lucide-react";
import { VocabularyBulkActionsProps } from "./types";
import { Badge } from "@/components/ui/badge";

const VocabularyBulkActions: React.FC<VocabularyBulkActionsProps> = ({
  selectedWords,
  onDelete,
  onImport,
  isImporting,
  deleteInProgress,
  importStatus,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:items-center mb-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 sm:h-9 text-xs gap-1"
          onClick={onImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Importing...</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>Import Vocabulary</span>
            </>
          )}
        </Button>
        
        {importStatus.imported > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Badge variant="outline" className="px-1.5 py-0">
              {importStatus.imported} imported
            </Badge>
            {importStatus.skipped > 0 && (
              <Badge variant="outline" className="px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                {importStatus.skipped} skipped
              </Badge>
            )}
            {importStatus.errors > 0 && (
              <Badge variant="outline" className="px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                {importStatus.errors} errors
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedWords.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 text-xs gap-1 text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={onDelete}
            disabled={deleteInProgress}
          >
            {deleteInProgress ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected ({selectedWords.length})</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VocabularyBulkActions;