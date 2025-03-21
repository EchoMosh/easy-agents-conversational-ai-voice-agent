
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
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            {columnMappings.map((mapping, index) => (
              <TableHead key={index} className="py-3 px-4 text-xs font-medium text-gray-700">
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
            <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} className="py-2 px-4 text-sm text-gray-800">
                  {cell || <span className="text-gray-400 italic">empty</span>}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
