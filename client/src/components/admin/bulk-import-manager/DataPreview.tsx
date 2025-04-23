import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataPreviewProps } from './types';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

const DataPreview: React.FC<DataPreviewProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="border rounded-md p-6 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-2">
          <Spinner size="lg" />
          <div className="text-sm text-muted-foreground">Loading preview data...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Get column names from the first item
  const columns = Object.keys(data[0]);
  
  // Limit visible rows
  const visibleRows = data.slice(0, 10);

  return (
    <div className="bg-white rounded-md border overflow-hidden">
      <div className="bg-primary/5 p-2 px-3 border-b">
        <div className="flex justify-between items-center">
          <div className="font-medium">Data Preview</div>
          <Badge variant="outline" className="bg-primary/10">
            {data.length} rows
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              {columns.slice(0, 5).map((column, index) => (
                <TableHead key={index} className="whitespace-nowrap text-xs">
                  {column}
                </TableHead>
              ))}
              {columns.length > 5 && (
                <TableHead className="whitespace-nowrap text-xs text-center">
                  +{columns.length - 5} more
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.slice(0, 5).map((column, columnIndex) => (
                  <TableCell 
                    key={columnIndex}
                    className={`whitespace-nowrap px-2 py-1.5 text-xs ${columnIndex === 0 ? "font-medium" : ""}`}
                  >
                    <div className="max-w-[200px] truncate">
                      {typeof row[column] === 'object' 
                        ? JSON.stringify(row[column]) 
                        : String(row[column] || "")
                      }
                      {columnIndex === 0 && (
                        <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                          {column}
                        </div>
                      )}
                    </div>
                  </TableCell>
                ))}
                {columns.length > 5 && (
                  <TableCell className="whitespace-nowrap px-2 py-1.5 text-xs text-center text-muted-foreground">
                    ...
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Mobile info section */}
      <div className="p-2 border-t text-xs text-muted-foreground sm:hidden">
        <p>Showing {Math.min(5, columns.length)} of {columns.length} columns. Scroll right to see more.</p>
      </div>
      {data.length > 10 && (
        <div className="bg-muted/30 p-2 text-sm text-muted-foreground border-t">
          Showing 10 of {data.length} rows
        </div>
      )}
    </div>
  );
};

export default DataPreview;