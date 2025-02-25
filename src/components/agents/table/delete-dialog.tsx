
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-red-600">{title}</SheetTitle>
          <SheetDescription className="text-base">
            {description}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="mt-8">
          <div className="flex w-full space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
