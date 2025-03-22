import React, { useState, useRef, useCallback } from "react";
import { Upload, FileText, Download } from "lucide-react";

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
    console.log("Validating file:", file.name, file.type, file.size);
    const validExtensions = ["csv", "xlsx", "xls", "txt"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      console.error("Invalid file extension:", fileExtension);
      return {
        valid: false,
        message: "Please upload a CSV, Excel, or Text file.",
      };
    }

    if (file.size > 10 * 1024 * 1024) {
      console.error("File too large:", file.size);
      return {
        valid: false,
        message: "File is too large. Maximum size is 10MB.",
      };
    }

    console.log("File validation passed");
    return { valid: true };
  };

  const processFile = useCallback(
    (file: File) => {
      console.log("Processing file:", file.name);
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("File read successfully");
        const content = e.target?.result as string;
        console.log("File content length:", content.length);
        console.log("Calling onFileSelect callback");
        onFileSelect(file, content);
      };
      reader.onerror = (e) => {
        console.error("Error reading file:", e);
        setError("Failed to read file. Please try again.");
      };
      console.log("Starting to read file as text");
      reader.readAsText(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      console.log("File dropped");

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        console.log("Processing dropped file");
        processFile(e.dataTransfer.files[0]);
      } else {
        console.error("No files found in drop event");
      }
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("File input change event triggered");
      if (e.target.files && e.target.files.length > 0) {
        console.log("Files selected:", e.target.files.length);
        processFile(e.target.files[0]);
      } else {
        console.error("No files selected or file input event without files");
      }
    },
    [processFile]
  );

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Select File button clicked");

    // Create and trigger a temporary file input
    // This is a workaround for browsers that might have issues with programmatically clicking hidden inputs
    try {
      console.log("Creating temporary file input");
      const tempFileInput = document.createElement("input");
      tempFileInput.type = "file";
      tempFileInput.accept = ".csv,.xlsx,.xls,.txt";
      tempFileInput.style.display = "none";
      tempFileInput.onchange = (event) => {
        console.log("Temporary file input change event");
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          console.log("File selected via temporary input");
          processFile(target.files[0]);
          // Clean up
          document.body.removeChild(tempFileInput);
        }
      };
      document.body.appendChild(tempFileInput);
      console.log("Triggering click on temporary file input");
      tempFileInput.click();
    } catch (error) {
      console.error("Error with temporary file input:", error);
      // Fall back to original method
      if (fileInputRef.current) {
        console.log("Falling back to original method");
        fileInputRef.current.click();
      }
    }
  };

  const downloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Download template button clicked");

    // Template CSV content
    const csvContent =
      "First Name,Last Name,Email,Phone,Company,Position\n" +
      "John,Doe,john.doe@example.com,123-456-7890,Acme Inc,CEO\n" +
      "Jane,Smith,jane.smith@example.com,098-765-4321,XYZ Corp,CTO";

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "leads_template.csv");

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log("Template download completed");
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 transition-all duration-200 ease-in-out rounded-xl p-10 text-center 
          ${
            dragActive
              ? "border-indigo-400 bg-indigo-50"
              : "border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          onChange={handleFileChange}
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: "0",
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            border: "0",
          }}
          onClick={(e) => console.log("File input clicked", e)}
        />

        <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-indigo-600" />
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Drag and drop your file here
        </h3>

        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Upload your spreadsheet to import leads. We support CSV, Excel and
          plain text files.
        </p>

        <button
          onClick={handleButtonClick}
          disabled={isLoading}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm 
            ${
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            }`}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isLoading ? "Uploading..." : "Select File"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-md p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center mt-4">
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          <Download className="h-3 w-3 mr-1" />
          Download template CSV
        </button>

        <p className="text-xs text-gray-500 text-center mt-6 max-w-md">
          Make sure your spreadsheet includes columns for First Name, Last Name,
          and Email to import leads successfully.
        </p>
      </div>
    </div>
  );
}
