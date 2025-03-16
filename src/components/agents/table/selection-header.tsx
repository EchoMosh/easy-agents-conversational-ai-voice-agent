
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  CheckSquare,
  Trash2,
} from "lucide-react";
import { BulkActionsDialog } from "@/components/leads/components/bulk-actions-dialog";

interface SelectionHeaderProps {
  selectedCount: number;
  onDelete: () => void;
  isDeleting: boolean;
  onMoveToPipeline?: (pipelineId: string) => void;
  onChangeStatus?: (status: string) => void;
  onAddVariables?: () => void;
  pipelines?: Array<{ id: string; name: string; }>;
}

export function SelectionHeader({ 
  selectedCount, 
  onDelete, 
  isDeleting,
  onMoveToPipeline,
  onChangeStatus,
  onAddVariables,
  pipelines = []
}: SelectionHeaderProps) {
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 flex items-center justify-between bg-background border rounded-lg p-4 shadow-sm">
      <span className="font-medium text-foreground">
        {selectedCount} lead{selectedCount > 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        <Button
          onClick={onDelete}
          variant="destructive"
          className="gap-2"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          Delete Leads
        </Button>
        
        <Button
          onClick={() => setIsBulkActionsOpen(true)}
          className="gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Bulk Actions
        </Button>
        
        <BulkActionsDialog 
          isOpen={isBulkActionsOpen}
          onOpenChange={setIsBulkActionsOpen}
          selectedCount={selectedCount}
          onDelete={onDelete}
          isDeleting={isDeleting}
          onMoveToPipeline={onMoveToPipeline || (() => {})}
          onChangeStatus={onChangeStatus || (() => {})}
          onAddVariables={onAddVariables || (() => {})}
          pipelines={pipelines}
        />
      </div>
    </div>
  );
}
