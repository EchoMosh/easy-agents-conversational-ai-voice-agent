
import { Button } from "@/components/ui/button";
import { PipelineColumn } from "@/types/pipeline";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

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
      onClose(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={!!stageToDelete}
      onOpenChange={(open) => {
        if (!isDeleting) {
          onClose(open);
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
        <DialogFooter className="flex justify-between sm:justify-between gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
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
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Stage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
