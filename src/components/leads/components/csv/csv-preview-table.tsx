import React from "react";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ColumnMapSelector } from "./column-map-selector";

export interface CsvData {
  headers: string[];
  rows: string[][];
}

export interface ColumnMapping {
  csvHeader: string;
  fieldName: string | null; // null means "ignore"
}

interface CsvPreviewTableProps {
  data: CsvData;
  columnMappings: ColumnMapping[];
  onUpdateMapping: (index: number, fieldName: string | null) => void;
  maxPreviewRows?: number;
}

export const CsvPreviewTable: React.FC<CsvPreviewTableProps> = ({
  data,
  columnMappings,
  onUpdateMapping,
  maxPreviewRows = 5
}) => {
  const previewRows = data.rows.slice(0, maxPreviewRows);
  
  return (
    <div className="border border-gray-200 rounded-md">
      {/* Key change: Using basic div with overflow instead of ShadCN ScrollArea */}
      <div className="overflow-x-auto overflow-y-auto h-[280px] relative">
        {/* Force table to be wide enough with a large min-width */}
        <div style={{ minWidth: `${Math.max(columnMappings.length * 200, 800)}px` }}>
          <Table className="w-full table-fixed">
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                {columnMappings.map((mapping, index) => (
                  <TableHead 
                    key={index} 
                    className="py-2 px-3 text-xs font-medium text-gray-700 bg-gray-50 border-b"
                    style={{ width: '200px', minWidth: '200px' }}
                  >
                    <ColumnMapSelector
                      csvHeader={mapping.csvHeader}
                      selectedField={mapping.fieldName}
                      onChange={(value) => onUpdateMapping(index, value)}
                    />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex} 
                  className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {row.map((cell, cellIndex) => (
                    <TableCell 
                      key={cellIndex} 
                      className="py-2 px-3 text-sm text-gray-800 border-t border-gray-100 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ width: '200px', minWidth: '200px' }}
                      title={cell}
                    >
                      {cell || <span className="text-gray-400 italic text-xs">empty</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}