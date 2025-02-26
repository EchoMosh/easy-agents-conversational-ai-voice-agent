
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type LeadHandlingOption = "keep" | "move" | "delete";

export function useDeletePipeline(
  handleDeletePipeline: (
    pipelineId: string,
    option: LeadHandlingOption,
    targetPipelineId?: string
  ) => Promise<void>
) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onDelete = async (option: LeadHandlingOption, targetPipelineId?: string) => {
    setIsDeleting(true);
    try {
      await handleDeletePipeline(pipelineId, option, targetPipelineId);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast({
        title: "Error",
        description: "Failed to delete pipeline",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    onDelete,
  };
}
