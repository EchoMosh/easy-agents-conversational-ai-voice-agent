
import { useState, useRef } from "react";
import Papa from "papaparse";
import { CsvData } from "./csv-preview-table";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  onFileData: (data: CsvData, fileName: string) => void;
  onError: (error: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileData, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      onError('Please upload a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      onError('File size exceeds the 5MB limit');
      return;
    }

    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          onError(`Error parsing CSV: ${results.errors[0].message}`);
          setIsLoading(false);
          return;
        }

        if (results.data.length === 0) {
          onError('The CSV file is empty');
          setIsLoading(false);
          return;
        }

        const headers = results.meta.fields || [];
        const rows = results.data.map((row: any) => headers.map(header => row[header] || ''));

        onFileData({ headers, rows }, file.name);
        setIsLoading(false);
      },
      error: (error) => {
        onError(`Failed to parse CSV: ${error.message}`);
        setIsLoading(false);
      }
    });
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/70'
      } transition-colors`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <div className="flex flex-col items-center justify-center gap-3">
        <div className={`rounded-full p-3 ${isDragging ? 'bg-primary/10' : 'bg-blue-500/10'}`}>
          {isLoading ? (
            <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-blue-500" />
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-base font-medium text-gray-800">
            {isLoading ? 'Processing file...' : 'Drag and drop a CSV file here'}
          </p>
          <p className="text-sm text-gray-600">
            or
          </p>
          <Button 
            variant="outline"
            size="sm"
            type="button"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-2"
          >
            <FileText className="mr-1.5 h-4 w-4" />
            Select CSV File
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 mt-4 max-w-sm">
          <p>File should include columns for: name, email, phone, etc.</p>
          <p className="mt-1">Maximum file size: 5MB</p>
        </div>
      </div>
    </div>
  );
};
