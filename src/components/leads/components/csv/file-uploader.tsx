
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
      className={`border-2 border-dashed rounded-lg p-10 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
      } transition-colors duration-200`}
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
      
      <div className="flex flex-col items-center justify-center gap-4">
        <div className={`rounded-full p-4 ${isDragging ? 'bg-blue-100' : 'bg-blue-50'}`}>
          {isLoading ? (
            <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-blue-500" />
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-800">
            {isLoading ? 'Processing file...' : 'Drag and drop your CSV file'}
          </p>
          <p className="text-base text-gray-600">
            or
          </p>
          <Button 
            variant="outline"
            type="button"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-2"
          >
            <FileText className="mr-2 h-4 w-4" />
            Select CSV File
          </Button>
        </div>
        
        <div className="text-sm text-gray-500 mt-4 max-w-md">
          <p>File should include columns for: name, email, phone, etc.</p>
          <p className="mt-1">Maximum file size: 5MB</p>
        </div>
      </div>
    </div>
  );
};
