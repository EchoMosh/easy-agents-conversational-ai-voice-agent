
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploader } from "./file-uploader";
import { CsvPreviewTable, CsvData, ColumnMapping } from "./csv-preview-table";
import { Info, AlertCircle, FileText } from "lucide-react";

interface CsvPreviewStageProps {
  onNext: (data: CsvData, mappings: ColumnMapping[]) => void;
  onCancel: () => void;
}

export const CsvPreviewStage: React.FC<CsvPreviewStageProps> = ({ onNext, onCancel }) => {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-map columns when CSV data loads
  useEffect(() => {
    if (csvData) {
      const initialMappings = csvData.headers.map((header) => {
        const lowerHeader = header.toLowerCase().trim();
        let fieldName: string | null = null;
        
        // Auto-map based on common header names
        if (lowerHeader.includes("name") || lowerHeader === "company") fieldName = "name";
        else if (lowerHeader.includes("email") || lowerHeader === "e-mail") fieldName = "email";
        else if (lowerHeader.includes("phone") || lowerHeader.includes("tel") || lowerHeader === "mobile") fieldName = "phone";
        else if (lowerHeader.includes("status")) fieldName = "status";
        else if (lowerHeader.includes("source") || lowerHeader === "where from" || lowerHeader === "origin") fieldName = "source";
        
        return { csvHeader: header, fieldName };
      });
      
      setColumnMappings(initialMappings);
    }
  }, [csvData]);

  const handleFileData = (data: CsvData, name: string) => {
    setCsvData(data);
    setFileName(name);
    setError(null);
  };

  const handleUpdateMapping = (index: number, fieldName: string | null) => {
    const newMappings = [...columnMappings];
    newMappings[index] = { ...newMappings[index], fieldName };
    setColumnMappings(newMappings);
  };

  const validateMappings = () => {
    // Check if required fields (name and email) are mapped
    const nameField = columnMappings.find(mapping => mapping.fieldName === "name");
    const emailField = columnMappings.find(mapping => mapping.fieldName === "email");
    
    if (!nameField) {
      setError("You must map a column to 'Name'");
      return false;
    }
    
    if (!emailField) {
      setError("You must map a column to 'Email'");
      return false;
    }
    
    // Check for duplicate mappings
    const mappedFields = columnMappings
      .map(m => m.fieldName)
      .filter(field => field !== null);
    
    const uniqueMappedFields = new Set(mappedFields);
    if (mappedFields.length !== uniqueMappedFields.size) {
      setError("You have mapped multiple columns to the same field");
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (csvData && validateMappings()) {
      onNext(csvData, columnMappings);
    }
  };

  return (
    <div className="space-y-5">
      {!csvData ? (
        <FileUploader onFileData={handleFileData} onError={setError} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-800 flex items-center">
                <FileText className="mr-2 h-4 w-4 text-blue-500" />
                {fileName}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {csvData.rows.length} rows found • Showing first {Math.min(5, csvData.rows.length)} rows
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCsvData(null);
                setFileName("");
                setColumnMappings([]);
              }}
            >
              Change File
            </Button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Map your CSV columns to lead fields</p>
                <p className="text-sm text-amber-700 mt-1">
                  Name and Email are required. Select "Ignore" for columns you don't want to import.
                </p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="h-[260px] border rounded-md">
            <div className="overflow-x-auto min-w-full w-max">
              {csvData && (
                <CsvPreviewTable
                  data={csvData}
                  columnMappings={columnMappings}
                  onUpdateMapping={handleUpdateMapping}
                  maxPreviewRows={5}
                />
              )}
            </div>
          </ScrollArea>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={!csvData || columnMappings.length === 0}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
