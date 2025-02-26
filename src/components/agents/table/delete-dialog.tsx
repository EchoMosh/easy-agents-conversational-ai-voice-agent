
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetPortal,
  SheetOverlay,
} from "@/components/ui/sheet";

interface DeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  title: string;
  description: string;
}

export function DeleteDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
  title,
  description
}: DeleteDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      onOpenChange(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetPortal>
        <SheetOverlay />
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="text-red-600">{title}</SheetTitle>
            <SheetDescription className="text-base">
              {description}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-8">
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
}
