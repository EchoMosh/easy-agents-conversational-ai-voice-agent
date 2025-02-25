
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useDeletePipeline(handleDeletePipeline: () => Promise<void>) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onDelete = async () => {
    setIsDeleting(true);
    try {
      await handleDeletePipeline();
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
