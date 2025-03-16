
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PipelineColumn } from "@/types/pipeline";
import { useState } from "react";

interface DeleteStageDialogProps {
  stageToDelete: PipelineColumn | null;
  onClose: (open: boolean) => void;
  onConfirm: (stage: PipelineColumn) => void;
}

export function DeleteStageDialog({ stageToDelete, onClose, onConfirm }: DeleteStageDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!stageToDelete) return;
    
    setIsDeleting(true);
    try {
      await onConfirm(stageToDelete);
      onClose(false); // Ensure dialog closes after deletion completes
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog 
      open={!!stageToDelete} 
      onOpenChange={(open) => {
        if (!isDeleting) { // Only allow closing if not deleting
          onClose(open);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the "{stageToDelete?.title}" stage and all its associated data.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={() => onClose(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Stage"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
