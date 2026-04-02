import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "@/context/workspace-context";
import { processAndImportLeads } from "@/utils/supabase-leads-utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { FileUploader } from "@/components/leads/components/bulk-import/file-uploader";
import { ColumnMapper } from "@/components/leads/components/bulk-import/column-mapper";
import { ImportOptions } from "@/components/leads/components/bulk-import/import-options";
import { useImport } from "@/context/import-context";
import { parseCSV } from "@/utils/csv-parser";

interface BulkImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const contentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15 },
  },
};

type Step = "upload" | "mapping" | "options" | "importing";

export function BulkImportDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: BulkImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [hasHeaders, setHasHeaders] = useState<boolean>(true);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {},
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [source, setSource] = useState<string>("");

  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { addImportJob, updateImportJobStatus } = useImport();

  const leadCount = fileContent
    ? Math.max(parseCSV(fileContent, hasHeaders).dataRows.length, 0)
    : 0;

  const resetState = () => {
    setStep("upload");
    setFileContent("");
    setFileName("");
    setColumnMapping({});
    setIsLoading(false);
    setSelectedTags([]);
    setSource("");
  };

  const handleClose = () => {
    if (step !== "importing") {
      onOpenChange(false);
      setTimeout(resetState, 300);
    }
  };

  const handleFileSelect = (selectedFile: File, content: string) => {
    setFileContent(content);
    setFileName(selectedFile.name);
    setStep("mapping");
  };

  const handleBack = () => {
    if (step === "mapping") {
      resetState();
    } else if (step === "options") {
      setStep("mapping");
    }
  };

  const assignTagsToLeads = async (leadIds: string[]) => {
    if (selectedTags.length === 0 || leadIds.length === 0) return;

    const tagRows = leadIds.flatMap((leadId) =>
      selectedTags.map((tagId) => ({ lead_id: leadId, tag_id: tagId })),
    );

    // Insert in batches of 500 to avoid payload limits
    const BATCH_SIZE = 500;
    for (let i = 0; i < tagRows.length; i += BATCH_SIZE) {
      const batch = tagRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("lead_tags").insert(batch);
      if (error) {
        console.error("Error assigning tags to leads:", error);
      }
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

      const result = await processAndImportLeads(
        fileContent,
        columnMapping,
        hasHeaders,
        {
          removeDuplicates,
          tags: selectedTags,
          workspaceId: currentWorkspace.id,
          userId: sessionData.session.user.id,
        },
      );

      // Assign tags to imported leads
      if (selectedTags.length > 0 && result.leadIds) {
        await assignTagsToLeads(result.leadIds);
      }

      updateImportJobStatus(jobId, {
        processed: result.imported,
      });

      updateImportJobStatus(jobId, {
        status: "completed",
        endTime: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSuccess();

      toast({
        title: "Import complete",
        description: `Successfully imported ${result.imported} leads.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      updateImportJobStatus(jobId, {
        status: "failed",
        endTime: new Date(),
        error: errorMessage,
      });

      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleMappingNext = () => {
    setStep("options");
  };

  const handleStartImport = () => {
    setStep("importing");
    setIsLoading(true);

    const jobId = addImportJob({
      status: "processing",
      fileName: fileName,
      leadCount: leadCount,
    });

    onOpenChange(false);
    setTimeout(resetState, 300);

    startImport(jobId);
  };

  const stepTitles: Record<Step, string> = {
    upload: "Import Leads",
    mapping: "Match your columns",
    options: "Tag & organize",
    importing: "Importing Leads",
  };

  const stepSubtitles: Record<Step, string | null> = {
    upload: null,
    mapping: "Map each column in your file to a lead field",
    options: "Add tags and source to all imported leads",
    importing: null,
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && step === "importing") return;
        if (!open) handleClose();
        else onOpenChange(open);
      }}
    >
      <Button
        onClick={() => onOpenChange(true)}
        variant="outline"
        className="border-primary text-primary hover:bg-primary/10"
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Spreadsheet
      </Button>

      <DialogContent
        className="p-0 border rounded-xl bg-background shadow-xl w-[95vw] max-w-[1100px] flex flex-col overflow-hidden"
        style={{ height: "70vh", maxHeight: "750px" }}
        onPointerDownOutside={(e) => {
          if (step === "importing") e.preventDefault();
        }}
      >
        <DialogHeader className="px-6 pt-5 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {stepTitles[step]}
          </DialogTitle>
          {stepSubtitles[step] && (
            <p className="text-sm text-muted-foreground mt-1">
              {stepSubtitles[step]}
            </p>
          )}
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
            className="flex-1 overflow-hidden min-h-0"
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
                onNext={handleMappingNext}
                onBack={handleBack}
              />
            )}

            {step === "options" && (
              <ImportOptions
                fileName={fileName}
                leadCount={leadCount}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                source={source}
                setSource={setSource}
                onNext={handleStartImport}
                onBack={handleBack}
              />
            )}

            {step === "importing" && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Processing your file
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  We're analyzing and importing your leads. This will continue
                  even if you close this dialog.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
