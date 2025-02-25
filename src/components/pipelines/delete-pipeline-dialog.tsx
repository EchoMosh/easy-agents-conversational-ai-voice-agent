
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

interface DeletePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function DeletePipelineDialog({
  open,
  onOpenChange,
  onDelete,
  isDeleting,
}: DeletePipelineDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Delete Pipeline</SheetTitle>
          <SheetDescription>
            Are you sure you want to delete this pipeline? This action cannot be undone.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="mt-4">
          <div className="flex justify-end gap-4 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
