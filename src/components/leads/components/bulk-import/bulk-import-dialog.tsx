
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState, useContext } from "react";
import { useWorkspace } from "@/context/workspace-context";
import { processAndImportLeads } from "@/utils/supabase-leads-utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FileUploader } from "@/components/leads/components/bulk-import/file-uploader";
import { ColumnMapper } from "@/components/leads/components/bulk-import/column-mapper";
import { TagSelector } from "@/components/leads/components/bulk-import/tag-selector";
import { useImport } from "@/context/import-context";

interface BulkImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  },
};

export function BulkImportDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: BulkImportDialogProps) {
  const [step, setStep] = useState<
    "upload" | "mapping" | "tagging" | "importing"
  >("upload");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [hasHeaders, setHasHeaders] = useState<boolean>(true);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );

  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { addImportJob, updateImportJobStatus } = useImport();

  const handleClose = () => {
    onOpenChange(false);
    // Only reset the step if we're not in the importing state
    if (step !== "importing") {
      setTimeout(() => setStep("upload"), 300);
    }
  };

  const handleFileSelect = (selectedFile: File, content: string) => {
    console.log(
      "handleFileSelect called in BulkImportDialog",
      selectedFile.name
    );
    setFile(selectedFile);
    setFileContent(content);
    setFileName(selectedFile.name);
    console.log("Setting step to mapping");
    setStep("mapping");
  };

  const handleBack = () => {
    if (step === "mapping") {
      setStep("upload");
      setFile(null);
      setFileContent("");
      setFileName("");
      setColumnMapping({});
    } else if (step === "tagging") {
      setStep("mapping");
    }
  };

  const startImport = async (jobId: string) => {
    try {
      if (!currentWorkspace?.id) {
        throw new Error("No active workspace found");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const leadCount = hasHeaders
        ? fileContent.split(/\r?\n/).length - 1
        : fileContent.split(/\r?\n/).length;

      // Process rows in batches for progress reporting
      const rows = fileContent.split(/\r?\n/).filter(row => row.trim());
      const dataRows = hasHeaders ? rows.slice(1) : rows;
      const totalLeads = dataRows.length;
      const batchSize = 25;
      let processedCount = 0;

      // Create batches
      let batches = [];
      for (let i = 0; i < dataRows.length; i += batchSize) {
        batches.push(dataRows.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchContent = hasHeaders ? [rows[0], ...batch].join('\n') : batch.join('\n');
        
        const result = await processAndImportLeads(
          batchContent,
          columnMapping,
          hasHeaders,
          {
            removeDuplicates,
            tags: selectedTags,
            workspaceId: currentWorkspace.id,
            userId: sessionData.session.user.id,
          }
        );

        processedCount += batch.length;
        
        // Update job status with progress
        updateImportJobStatus(jobId, {
          processed: processedCount,
        });
      }

      // Import completed successfully
      updateImportJobStatus(jobId, {
        status: "completed",
        endTime: new Date(),
      });

      onSuccess();
    } catch (error) {
      console.error("Import error:", error);
      
      // Update job status with error
      updateImportJobStatus(jobId, {
        status: "failed",
        endTime: new Date(),
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleNext = async () => {
    if (step === "mapping") {
      const leadCount = hasHeaders
        ? fileContent.split(/\r?\n/).length - 1
        : fileContent.split(/\r?\n/).length;

      setStep("tagging");
    } else if (step === "tagging") {
      setStep("importing");
      setIsLoading(true);
      setImportError(null);

      const leadCount = hasHeaders
        ? fileContent.split(/\r?\n/).length - 1
        : fileContent.split(/\r?\n/).length;

      // Create and start an import job that will continue in the background
      const jobId = addImportJob({
        status: "processing",
        fileName: fileName,
        leadCount: leadCount,
      });

      // Start import process
      handleClose();

      // Continue processing in the background
      startImport(jobId);
    }
  };

  const getDialogTitle = () => {
    switch (step) {
      case "upload":
        return "Import Leads";
      case "mapping":
        return "Match the columns in your file";
      case "tagging":
        return "Add Tags to Leads";
      case "importing":
        return "Importing Leads";
      default:
        return "Import Leads";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <motion.div
        key="dialog-trigger"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Button
          onClick={() => onOpenChange(true)}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Spreadsheet
        </Button>
      </motion.div>

      <DialogContent
        transparent={false}
        className="p-0 border-none rounded-xl will-change-transform bg-white 
        shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] mx-auto w-[95vw] max-w-[1200px]"
        style={{
          zIndex: 9999,
          height: "75vh",
          maxHeight: "800px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onPointerDownOutside={(e) => {
          console.log("Pointer down outside dialog content");
          if (step === "upload") {
            console.log("Preventing dialog close in upload step");
            e.preventDefault();
          }
        }}
      >
        <motion.div
          key="dialog-content"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={dialogVariants}
          className="rounded-xl h-full flex flex-col"
        >
          <DialogHeader className="p-6 pb-3 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="text-xl font-medium text-gray-800">
              {getDialogTitle()}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              className="flex-grow overflow-hidden"
              style={{ minHeight: 0 }}
            >
              {step === "upload" && (
                <FileUploader
                  onFileSelect={handleFileSelect}
                  isLoading={isLoading}
                />
              )}

              {step === "mapping" && (
                <ColumnMapper
                  fileContent={fileContent}
                  fileName={fileName}
                  hasHeaders={hasHeaders}
                  setHasHeaders={setHasHeaders}
                  removeDuplicates={removeDuplicates}
                  setRemoveDuplicates={setRemoveDuplicates}
                  columnMapping={columnMapping}
                  setColumnMapping={setColumnMapping}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {step === "tagging" && (
                <TagSelector
                  fileName={fileName}
                  leadCount={
                    hasHeaders
                      ? fileContent.split(/\r?\n/).length - 1
                      : fileContent.split(/\r?\n/).length
                  }
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {step === "importing" && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-20 h-20 mb-6">
                    <div className="w-full h-full rounded-full border-4 border-t-indigo-600 border-r-indigo-300 border-b-indigo-100 border-l-indigo-200 animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-gray-800">
                    Processing your file
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    We're analyzing and importing your leads. This will only
                    take a moment.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
