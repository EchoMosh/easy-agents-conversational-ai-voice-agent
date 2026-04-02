import React, { useState, useEffect } from "react";
import { Info, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseCSV } from "@/utils/csv-parser";
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
  { value: "custom", label: "Skip (don't import)", required: false },
];

function RadioOption({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
        selected
          ? "bg-primary/10 border border-primary/20"
          : "bg-muted/50 hover:bg-muted border border-transparent"
      }`}
      onClick={onClick}
    >
      <div
        className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
          selected ? "bg-primary" : "border-2 border-muted-foreground/30"
        }`}
      >
        {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

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
      const parsed = parseCSV(fileContent, hasHeaders);

      if (parsed.headers.length === 0) throw new Error("No data found in file");

      const headerRow = parsed.headers;
      const dataRows = parsed.dataRows.slice(0, 5);

      // Rebuild mapping if empty or if headers changed (e.g. hasHeaders toggled)
      const existingKeys = Object.keys(columnMapping);
      const headersChanged =
        existingKeys.length === 0 ||
        existingKeys.length !== headerRow.length ||
        existingKeys.some((k) => !headerRow.includes(k));

      if (headersChanged) {
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
      setHeaders([]);
      setCsvData([]);
      setValidationErrors([
        "Unable to parse your file. Please ensure it is a valid CSV file and try again.",
      ]);
    }
  }, [fileContent, hasHeaders]);

  useEffect(() => {
    const errors: string[] = [];

    FIELD_OPTIONS.forEach((field) => {
      if (
        field.required &&
        !Object.values(columnMapping).includes(field.value)
      ) {
        errors.push(
          `"${field.label}" is required but not mapped to any column`,
        );
      }
    });

    setValidationErrors(errors);
    setIsValid(errors.length === 0);
  }, [columnMapping]);

  const handleColumnMappingChange = (
    columnHeader: string,
    fieldValue: string,
  ) => {
    setColumnMapping({
      ...columnMapping,
      [columnHeader]: fieldValue,
    });
  };

  const displayFileName =
    fileName.length > 40 ? fileName.substring(0, 37) + "..." : fileName;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-6">
        {/* File name badge */}
        <div className="flex-shrink-0 mb-4">
          <div className="text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {displayFileName}
            </span>
          </div>
        </div>

        {/* Data preview table */}
        <div className="flex-shrink-0 border border-border rounded-xl overflow-hidden bg-card">
          <div
            className="overflow-x-auto overflow-y-auto"
            style={{ maxHeight: "240px" }}
          >
            <div
              style={{
                minWidth: Math.max(headers.length * 150, 500) + "px",
              }}
            >
              {/* Column headers */}
              <div className="sticky top-0 z-20">
                <div className="flex bg-muted/50">
                  {headers.map((header, index) => (
                    <div
                      key={index}
                      className="py-2.5 px-3 text-left font-medium text-foreground text-xs whitespace-nowrap flex-shrink-0 border-b border-border"
                      style={{ width: "150px", minWidth: "150px" }}
                      title={header}
                    >
                      <div className="truncate">{header}</div>
                    </div>
                  ))}
                </div>

                {/* Column mapping selects */}
                <div className="flex bg-muted/30 border-b border-border">
                  {headers.map((header, index) => (
                    <div
                      key={index}
                      className="py-2 px-2 flex-shrink-0"
                      style={{ width: "150px", minWidth: "150px" }}
                    >
                      <Select
                        value={columnMapping[header] || "custom"}
                        onValueChange={(value) =>
                          handleColumnMappingChange(header, value)
                        }
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {FIELD_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="text-xs"
                            >
                              {option.label}
                              {option.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data rows */}
              {csvData.slice(0, 4).map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`flex ${
                    rowIndex % 2 === 0 ? "bg-card" : "bg-muted/20"
                  }`}
                >
                  {row.map((cell, cellIndex) => (
                    <div
                      key={cellIndex}
                      className="py-2 px-3 text-muted-foreground text-xs leading-5 flex-shrink-0"
                      style={{ width: "150px", minWidth: "150px" }}
                      title={cell}
                    >
                      <div className="truncate">
                        {cell || (
                          <span className="text-muted-foreground/50 italic">
                            --
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2 mb-4">
          Showing preview of {csvData.length} rows
        </p>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">
              File Structure
            </h3>
            <div className="space-y-2">
              <RadioOption
                selected={hasHeaders}
                onClick={() => setHasHeaders(true)}
                label="First row contains labels"
              />
              <RadioOption
                selected={!hasHeaders}
                onClick={() => setHasHeaders(false)}
                label="First row contains data"
              />
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Duplicate Handling
            </h3>
            <div className="space-y-2">
              <RadioOption
                selected={removeDuplicates}
                onClick={() => setRemoveDuplicates(true)}
                label="Remove duplicate phone numbers"
              />
              <RadioOption
                selected={!removeDuplicates}
                onClick={() => setRemoveDuplicates(false)}
                label="Keep duplicate phone numbers"
              />
            </div>
          </div>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 border border-destructive/20 mb-4">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Please map the required fields
                </p>
                <ul className="mt-1 text-xs text-destructive/80 space-y-0.5">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-4 border-t border-border flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button onClick={onNext} disabled={!isValid}>
            Import Leads
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
