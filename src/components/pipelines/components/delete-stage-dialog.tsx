
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PipelineColumn } from "@/types/pipeline";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DeleteStageDialogProps {
  stageToDelete: PipelineColumn | null;
  onClose: () => void;
  onConfirm: (stage: PipelineColumn) => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteStageDialog({
  stageToDelete,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteStageDialogProps) {
  const [error, setError] = useState<string | null>(null);

  if (!stageToDelete) return null;

  const handleConfirm = async () => {
    try {
      if (!stageToDelete) return;
      setError(null);
      await onConfirm(stageToDelete);
    } catch (err) {
      console.error("Error in DeleteStageDialog confirm handler:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <AlertDialog open={!!stageToDelete} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Stage</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the stage "{stageToDelete.title}"? 
            This action cannot be undone. Any leads in this stage will need to be moved manually.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" /> Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
