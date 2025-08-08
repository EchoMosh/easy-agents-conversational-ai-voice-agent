
import React, { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColumnMapperProps {
  fileContent: string;
  fileName: string;
  hasHeaders: boolean;
  setHasHeaders: (value: boolean) => void;
  removeDuplicates: boolean;
  setRemoveDuplicates: (value: boolean) => void;
  columnMapping: Record<string, string>;
  setColumnMapping: (mapping: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

const FIELD_OPTIONS = [
  { value: "first_name", label: "First Name", required: true },
  { value: "last_name", label: "Last Name", required: false },
  { value: "email", label: "Email", required: false },
  { value: "phone", label: "Phone", required: true },
  { value: "company", label: "Company", required: false },
  { value: "job_title", label: "Position", required: false },
  { value: "custom", label: "Custom", required: false },
];

export function ColumnMapper({
  fileContent,
  fileName,
  hasHeaders,
  setHasHeaders,
  removeDuplicates,
  setRemoveDuplicates,
  columnMapping,
  setColumnMapping,
  onNext,
  onBack,
}: ColumnMapperProps) {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!fileContent) return;

    try {
      const rows = fileContent.split(/\r?\n/).filter((row) => row.trim());
      const parsedData = rows.map((row) => {
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        return matches.map((value) =>
          value.startsWith('"') && value.endsWith('"')
            ? value.slice(1, -1)
            : value
        );
      });

      if (parsedData.length === 0) throw new Error("No data found in file");

      const headerRow = hasHeaders
        ? parsedData[0]
        : parsedData[0].map((_, i) => `Column ${i + 1}`);
      const dataRows = hasHeaders
        ? parsedData.slice(1, 6)
        : parsedData.slice(0, 5);

      if (Object.keys(columnMapping).length === 0) {
        const initialMapping: Record<string, string> = {};
        headerRow.forEach((header) => {
          const headerLower = header.toLowerCase().trim();

          if (headerLower.includes("first") || headerLower === "firstname") {
            initialMapping[header] = "first_name";
          } else if (
            headerLower.includes("last") ||
            headerLower === "lastname"
          ) {
            initialMapping[header] = "last_name";
          } else if (headerLower.includes("email")) {
            initialMapping[header] = "email";
          } else if (
            headerLower.includes("phone") ||
            headerLower.includes("mobile")
          ) {
            initialMapping[header] = "phone";
          } else if (
            headerLower.includes("company") ||
            headerLower.includes("business")
          ) {
            initialMapping[header] = "company";
          } else if (
            headerLower.includes("position") ||
            headerLower.includes("title") ||
            headerLower.includes("job")
          ) {
            initialMapping[header] = "job_title";
          } else {
            initialMapping[header] = "custom";
          }
        });
        setColumnMapping(initialMapping);
      }

      setHeaders(headerRow);
      setCsvData(dataRows);
    } catch (error) {
      console.error("Error parsing CSV:", error);
    }
  }, [fileContent, hasHeaders]);

  useEffect(() => {
    const errors: string[] = [];

    FIELD_OPTIONS.forEach((field) => {
      if (field.required && !Object.values(columnMapping).includes(field.value)) {
        errors.push(
          `"${field.label}" is required but not mapped to any column`
        );
      }
    });

    setValidationErrors(errors);
    setIsValid(errors.length === 0);
  }, [columnMapping]);

  const handleColumnMappingChange = (
    columnHeader: string,
    fieldValue: string
  ) => {
    setColumnMapping({
      ...columnMapping,
      [columnHeader]: fieldValue,
    });
  };

  const displayFileName =
    fileName.length > 40 ? fileName.substring(0, 37) + "..." : fileName;

  const getFieldLabel = (value: string) => {
    const field = FIELD_OPTIONS.find((f) => f.value === value);
    return field ? field.label : "Custom";
  };

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-6">
        <div className="flex-shrink-0 mb-3">
          <div className="text-center text-sm text-gray-500">
            <span className="text-xs uppercase tracking-wider font-medium">
              File:
            </span>{" "}
            {displayFileName}
          </div>
        </div>

        <div
          className="flex-shrink-0 border border-gray-100 rounded-xl shadow-sm bg-white relative"
          style={{ height: "240px" }}
        >
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-200/80 rounded-full z-20 pointer-events-none flex items-center justify-center shadow-sm">
            <div className="text-gray-600 font-bold">❮</div>
          </div>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-200/80 rounded-full z-20 pointer-events-none flex items-center justify-center shadow-sm">
            <div className="text-gray-600 font-bold">❯</div>
          </div>

          <div
            className="absolute inset-0 overflow-x-auto overflow-y-auto scrollbar-thin"
            style={{
              WebkitOverflowScrolling: "touch",
              msOverflowStyle: "auto",
              scrollbarWidth: "thin",
            }}
          >
            <div style={{ minWidth: Math.max(headers.length * 140, 500) + "px" }}>
              <div className="sticky top-0 z-20">
                <div className="flex bg-gray-50">
                  {headers.map((header, index) => (
                    <div
                      key={index}
                      className="py-2 px-3 text-left font-medium text-gray-600 whitespace-nowrap flex-shrink-0 border-b"
                      style={{ width: "140px", minWidth: "140px" }}
                      title={header}
                    >
                      <div className="truncate">{header}</div>
                    </div>
                  ))}
                </div>

                <div className="flex bg-gray-50/80 backdrop-blur-sm border-b">
                  {headers.map((header, index) => (
                    <div
                      key={index}
                      className="py-2 px-3 flex-shrink-0"
                      style={{ width: "140px", minWidth: "140px" }}
                    >
                      <Select
                        value={columnMapping[header] || "custom"}
                        onValueChange={(value) =>
                          handleColumnMappingChange(header, value)
                        }
                      >
                        <SelectTrigger className="w-full h-7 text-xs bg-white border-gray-200 shadow-sm hover:bg-gray-50 focus:ring-1 focus:ring-gray-50 px-2">
                          <SelectValue
                            placeholder="Select field"
                            className="truncate"
                          />
                        </SelectTrigger>
                        <SelectContent
                          position="item-aligned"
                          className="z-[9999]"
                        >
                          {FIELD_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="text-xs"
                            >
                              {option.label}{" "}
                              {option.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {csvData.slice(0, 4).map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`flex ${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  {row.map((cell, cellIndex) => (
                    <div
                      key={cellIndex}
                      className="py-2 px-3 text-gray-700 text-xs leading-5 flex-shrink-0"
                      style={{ width: "140px", minWidth: "140px" }}
                      title={cell}
                    >
                      <div className="truncate">
                        {cell || <span className="text-gray-400 italic">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 animate-pulse-x"
              style={{ width: "200%", left: "-50%" }}
            ></div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mt-1 mb-2">
          Showing preview of {csvData.length} rows
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              File Structure
            </h3>

            <div className="space-y-2">
              <div
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  hasHeaders
                    ? "bg-indigo-50 border-indigo-100 border"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                }`}
                onClick={() => setHasHeaders(true)}
              >
                <div
                  className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                    hasHeaders ? "bg-indigo-600" : "border border-gray-300"
                  }`}
                >
                  {hasHeaders && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-sm font-medium">
                  First row contains labels
                </span>
              </div>

              <div
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  !hasHeaders
                    ? "bg-indigo-50 border-indigo-100 border"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                }`}
                onClick={() => setHasHeaders(false)}
              >
                <div
                  className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                    !hasHeaders ? "bg-indigo-600" : "border border-gray-300"
                  }`}
                >
                  {!hasHeaders && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-sm font-medium">
                  First row contains data
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Duplicate Handling
            </h3>

            <div className="space-y-2">
              <div
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  removeDuplicates
                    ? "bg-indigo-50 border-indigo-100 border"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                }`}
                onClick={() => setRemoveDuplicates(true)}
              >
                <div
                  className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                    removeDuplicates
                      ? "bg-indigo-600"
                      : "border border-gray-300"
                  }`}
                >
                  {removeDuplicates && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-sm font-medium">
                  Remove duplicate phone numbers
                </span>
              </div>

              <div
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  !removeDuplicates
                    ? "bg-indigo-50 border-indigo-100 border"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                }`}
                onClick={() => setRemoveDuplicates(false)}
              >
                <div
                  className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                    !removeDuplicates
                      ? "bg-indigo-600"
                      : "border border-gray-300"
                  }`}
                >
                  {!removeDuplicates && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-sm font-medium">
                  Keep duplicate phone numbers
                </span>
              </div>
            </div>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="rounded-md bg-red-50 px-3 py-2 border border-red-100 shadow-sm mb-3">
            <div className="flex">
              <Info className="h-4 w-4 text-red-400 mt-0.5" />
              <div className="ml-2">
                <p className="text-sm font-medium text-red-800">
                  Please map the required fields
                </p>
                <ul className="mt-1 text-xs text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t mt-4">
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Back to Upload
            </button>

            <button
              onClick={onNext}
              disabled={!isValid}
              className={`px-6 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isValid
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:ring-indigo-500"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Next Step
            </button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
