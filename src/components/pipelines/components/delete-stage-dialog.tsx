
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PipelineColumn } from "@/types/pipeline";

interface DeleteStageDialogProps {
  stageToDelete: PipelineColumn | null;
  onClose: (open: boolean) => void;
  onConfirm: (stage: PipelineColumn) => void;
}

export function DeleteStageDialog({ stageToDelete, onClose, onConfirm }: DeleteStageDialogProps) {
  return (
    <AlertDialog 
      open={!!stageToDelete} 
      onOpenChange={onClose}
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
          <AlertDialogCancel onClick={() => onClose(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => stageToDelete && onConfirm(stageToDelete)}
          >
            Delete Stage
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
