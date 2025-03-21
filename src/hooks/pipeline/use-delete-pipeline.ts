
import { useState } from "react";
import { toast } from "sonner";

type LeadHandlingOption = "keep" | "move" | "delete";

export function useDeletePipeline(
  handleDeletePipeline: (
    pipelineId: string,
    option: LeadHandlingOption,
    targetPipelineId?: string
  ) => Promise<void>,
  pipelineId?: string
) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onDelete = async (option: LeadHandlingOption, targetPipelineId?: string) => {
    if (!pipelineId) return;
    
    setIsDeleting(true);
    try {
      await handleDeletePipeline(pipelineId, option, targetPipelineId);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast.error("Failed to delete pipeline");
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
