
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

interface SelectionHeaderProps {
  selectedCount: number;
  onDelete: () => void;
  isDeleting: boolean;
}

export function SelectionHeader({ selectedCount, onDelete, isDeleting }: SelectionHeaderProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 flex items-center justify-between bg-muted p-4 rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount} agent{selectedCount > 1 ? 's' : ''} selected
      </span>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash className="h-4 w-4 mr-2" />
        Delete Selected
      </Button>
    </div>
  );
}
