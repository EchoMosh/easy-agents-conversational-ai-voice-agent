import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Upload, FileText, X } from "lucide-react";

interface ScriptStepProps {
  scriptText: string;
  onScriptChange: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export function ScriptStep({
  scriptText,
  onScriptChange,
  onNext,
  onBack,
  isProcessing,
}: ScriptStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setFileError(null);

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setFileError("File is too large. Maximum size is 10MB.");
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !["pdf", "txt", "doc"].includes(extension)) {
        setFileError(
          "Unsupported file type. Please upload a .pdf, .txt, or .doc file.",
        );
        return;
      }

      try {
        const text = await file.text();
        if (text.trim()) {
          onScriptChange(text);
          setFileName(file.name);
        } else {
          setFileError(
            "Could not extract text from this file. Try pasting the script text manually.",
          );
        }
      } catch (err) {
        console.error("Error reading file:", err);
        setFileError(
          "Failed to read file. Try pasting the script text manually.",
        );
      }
    },
    [onScriptChange],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset so re-uploading the same file triggers onChange
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearFile = () => {
    setFileName(null);
    onScriptChange("");
    setFileError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Import Your Script</h2>
        <p className="text-muted-foreground">
          Upload a sales script or paste it below to auto-build your agent's
          conversation flow
        </p>
      </div>

      {/* File upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.doc"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        {fileName ? (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium">{fileName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="ml-1 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Remove file"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to select or drag and drop a file here
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              PDF, TXT, or DOC (max 10MB)
            </p>
          </>
        )}
      </div>

      {fileError && <p className="text-sm text-destructive">{fileError}</p>}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t" />
        <span className="text-sm text-muted-foreground">
          or paste your script
        </span>
        <div className="flex-1 border-t" />
      </div>

      {/* Textarea for pasting */}
      <Textarea
        placeholder="Paste your sales script here..."
        value={scriptText}
        onChange={(e) => {
          onScriptChange(e.target.value);
          // Clear file name if user manually types
          if (fileName) setFileName(null);
        }}
        className="min-h-[160px] resize-y"
        disabled={isProcessing}
      />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          size="lg"
          onClick={onBack}
          disabled={isProcessing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button
          className="w-full"
          size="lg"
          onClick={onNext}
          disabled={isProcessing}
        >
          {isProcessing ? (
            "Analyzing script..."
          ) : scriptText.trim() ? (
            <>
              Create Agent
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Skip & Create Agent
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
