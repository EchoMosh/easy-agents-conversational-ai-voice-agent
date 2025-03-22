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

interface BulkImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Animation variants
const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }, // Apple-style cubic-bezier
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

  // Get workspace context and toast
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();

  const handleClose = () => {
    onOpenChange(false);
    // Reset to first step when dialog closes
    setTimeout(() => setStep("upload"), 300);
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
      // Reset the file and content to allow selecting a new file
      setFile(null);
      setFileContent("");
      setFileName("");
      setColumnMapping({});
    } else if (step === "tagging") {
      // Go back to mapping step
      setStep("mapping");
    }
  };

  const handleNext = async () => {
    if (step === "mapping") {
      // Estimate number of leads for tagging screen
      const leadCount = hasHeaders
        ? fileContent.split(/\r?\n/).length - 1
        : fileContent.split(/\r?\n/).length;

      // Move to tagging step
      setStep("tagging");
    } else if (step === "tagging") {
      // Now move to importing
      setStep("importing");
      setIsLoading(true);
      setImportError(null);

      try {
        // Make sure we have a workspace
        if (!currentWorkspace?.id) {
          throw new Error("No active workspace found");
        }

        // Get user ID from Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user?.id) {
          throw new Error("User not authenticated");
        }

        // Process and import the leads
        const result = await processAndImportLeads(
          fileContent,
          columnMapping,
          hasHeaders,
          {
            removeDuplicates,
            tags: selectedTags,
            workspaceId: currentWorkspace.id,
            userId: sessionData.session.user.id,
          }
        );

        // Show success message
        toast({
          title: "Import successful",
          description: `Imported ${result.imported} leads${
            result.duplicates > 0
              ? ` (${result.duplicates} duplicates skipped)`
              : ""
          }`,
        });

        // Close dialog and refresh leads list
        handleClose();
        onSuccess();
      } catch (error) {
        console.error("Import error:", error);
        setImportError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );

        toast({
          variant: "destructive",
          title: "Import failed",
          description:
            error instanceof Error ? error.message : "Failed to import leads",
        });

        // Go back to mapping step
        setStep("mapping");
      } finally {
        setIsLoading(false);
      }
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
          zIndex: 9999, // Ensure it's above everything
          overflow: "hidden", // Prevent any scrolling on the dialog itself
          height: "85vh", // Fixed height for the dialog
          maxHeight: "900px", // Maximum height to prevent too large dialogs
        }}
        onPointerDownOutside={(e) => {
          console.log("Pointer down outside dialog content");
          // Always prevent closing when in upload step to avoid interference with file dialog
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
          className="rounded-xl h-full flex flex-col" // Add flex layout, use full height
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
              className="flex-grow relative" // Relative positioning for content area
              style={{ minHeight: 0 }} // Critical for flex child to respect parent height
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
