import React, { useEffect, useRef } from "react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Force a redraw after component mounts to ensure scroll behavior works properly
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Force a reflow by accessing a layout property and then doing a small timeout
      const _ = scrollContainerRef.current.scrollWidth;
      
      // This timeout helps ensure all styles are fully applied
      setTimeout(() => {
        if (scrollContainerRef.current) {
          // Small scroll to ensure scrolling is working
          scrollContainerRef.current.scrollLeft = 1;
          scrollContainerRef.current.scrollLeft = 0;
        }
      }, 100);
    }
  }, [columnMappings.length]);
  
  // Calculate a width per column, with a minimum for usability
  const cellWidth = Math.max(180, Math.min(200, 1200 / columnMappings.length));
  const tableWidth = Math.max(800, columnMappings.length * cellWidth);
  
  return (
    <div className="border border-gray-200 rounded-md" style={{ maxWidth: '100%' }}>
      {/* Directly use browser native scrolling for maximum compatibility */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-scroll overflow-y-auto h-[280px]" 
        style={{ 
          WebkitOverflowScrolling: 'touch', // Enhance scroll on iOS
          scrollbarWidth: 'thin' // Better scrollbar on Firefox
        }}
      >
        {/* Force enough width to trigger horizontal scrolling */}
        <div style={{ width: `${tableWidth}px`, minWidth: `${tableWidth}px` }}>
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {columnMappings.map((mapping, index) => (
                  <th 
                    key={index} 
                    className="py-2 px-3 text-xs font-medium text-gray-700 bg-gray-50 border-b"
                    style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                  >
                    <ColumnMapSelector
                      csvHeader={mapping.csvHeader}
                      selectedField={mapping.fieldName}
                      onChange={(value) => onUpdateMapping(index, value)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {row.map((cell, cellIndex) => (
                    <td 
                      key={cellIndex} 
                      className="py-2 px-3 text-sm text-gray-800 border-t border-gray-100 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                      title={cell}
                    >
                      {cell || <span className="text-gray-400 italic text-xs">empty</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}