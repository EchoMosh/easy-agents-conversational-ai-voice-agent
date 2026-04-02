import React, { useState, useRef, useCallback } from "react";
import { Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  onFileSelect: (file: File, content: string) => void;
  isLoading: boolean;
}

export function FileUploader({ onFileSelect, isLoading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File) => {
    const validExtensions = ["csv", "txt"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return {
        valid: false,
        message: "Please upload a CSV or Text file.",
      };
    }

    if (file.size > 10 * 1024 * 1024) {
      return {
        valid: false,
        message: "File is too large. Maximum size is 10MB.",
      };
    }

    return { valid: true };
  };

  const processFile = useCallback(
    (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content || !content.trim()) {
          setError(
            "The file appears to be empty. Please select a file with data.",
          );
          return;
        }
        onFileSelect(file, content);
      };
      reader.onerror = () => {
        setError("Failed to read file. Please try again.");
      };
      reader.readAsText(file);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFile(e.target.files[0]);
      }
    },
    [processFile],
  );

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const downloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const csvContent =
      "First Name,Last Name,Email,Phone\n" +
      "John,Doe,john.doe@example.com,123-456-7890\n" +
      "Jane,Smith,jane.smith@example.com,098-765-4321";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "leads_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center h-full">
      <div
        className={`w-full border-2 transition-all duration-200 ease-in-out rounded-xl p-10 text-center ${
          dragActive
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="sr-only"
        />

        <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h3 className="text-lg font-medium text-foreground mb-1">
          Drag and drop your file here
        </h3>

        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Upload your spreadsheet to import leads. We support CSV and plain text
          files.
        </p>

        <Button onClick={handleButtonClick} disabled={isLoading}>
          <Upload className="h-4 w-4 mr-2" />
          {isLoading ? "Uploading..." : "Select File"}
        </Button>
      </div>

      {error && (
        <div className="w-full mt-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-md p-3 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center mt-6 gap-3">
        <Button variant="link" size="sm" onClick={downloadTemplate}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Download template CSV
        </Button>

        <p className="text-xs text-muted-foreground text-center max-w-md">
          Your file needs at least First Name and Phone columns. Email and Last
          Name are optional.
        </p>
      </div>
    </div>
  );
}
