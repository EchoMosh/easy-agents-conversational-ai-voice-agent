
import React, { forwardRef } from "react";
import { FileText } from "lucide-react";

interface FileUploaderProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

export const FileUploader = forwardRef<HTMLInputElement, FileUploaderProps>(
  ({ onChange, isUploading }, ref) => {
    return (
      <div className="mt-4">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
          <input
            ref={ref}
            type="file"
            className="hidden"
            onChange={onChange}
            accept=".pdf,.docx,.txt,.csv,.xlsx"
            disabled={isUploading}
          />
          <FileText className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            {isUploading
              ? "Uploading..."
              : "Click to select or drag and drop a file here"}
          </p>
          <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-1">
            PDF, DOCX, TXT, CSV, XLSX (max 10MB)
          </p>
        </div>
      </div>
    );
  }
);

FileUploader.displayName = "FileUploader";
