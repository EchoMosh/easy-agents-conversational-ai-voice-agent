
import { Button } from "@/components/ui/button";
import { PipelineColumn } from "@/types/pipeline";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DeleteStageDialogProps {
  stageToDelete: PipelineColumn | null;
  onClose: (open: boolean) => void;
  onConfirm: (stage: PipelineColumn) => void;
}

export function DeleteStageDialog({ stageToDelete, onClose, onConfirm }: DeleteStageDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Safety timeout to prevent permanent UI lock
  useEffect(() => {
    let timeoutId: number | undefined;
    
    if (isDeleting) {
      timeoutId = window.setTimeout(() => {
        console.log("Delete operation timeout - resetting state");
        setIsDeleting(false);
      }, 10000); // 10-second safety timeout
    }
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isDeleting]);

  const handleDelete = async () => {
    if (!stageToDelete) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm(stageToDelete);
      onClose(false);
    } catch (err) {
      console.error("Error deleting stage:", err);
      setError(typeof err === 'string' ? err : 'Failed to delete stage. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={!!stageToDelete}
      onOpenChange={(open) => {
        // Always allow closing the dialog, even during deletion
        if (!open) {
          setError(null);
          onClose(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Stage</DialogTitle>
          <DialogDescription>
            This will permanently delete the "{stageToDelete?.title}" stage and all its associated data.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter className="flex justify-between sm:justify-between gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              onClose(false);
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? "Deleting..." : "Delete Stage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
