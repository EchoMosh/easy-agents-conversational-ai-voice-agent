
import { Button } from "@/components/ui/button";
import { PipelineColumn } from "@/types/pipeline";
import { useState } from "react";
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle 
} from "@/components/ui/drawer";
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
    <Drawer
      open={!!stageToDelete}
      onOpenChange={(open) => {
        if (!isDeleting) {
          onClose(open);
        }
      }}
      direction="right"
    >
      <DrawerContent className="max-w-sm ml-auto">
        <DrawerHeader>
          <DrawerTitle>Are you sure?</DrawerTitle>
          <DrawerDescription>
            This will permanently delete the "{stageToDelete?.title}" stage and all its associated data.
            This action cannot be undone.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex flex-row justify-end gap-3">
          <DrawerClose asChild>
            <Button variant="outline" disabled={isDeleting}>Cancel</Button>
          </DrawerClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Stage"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
