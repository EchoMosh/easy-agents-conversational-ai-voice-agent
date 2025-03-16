
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BulkActionsDialog } from "@/components/leads/components/bulk-actions-dialog";
import { CircleX, ClipboardCheck } from "lucide-react";

interface SelectionHeaderProps {
  selectedCount: number;
  onDelete: () => void;
  isDeleting: boolean;
  onMoveToPipeline: (pipelineId: string) => void;
  onChangeStatus: (status: string) => void;
  onAddVariables: () => void;
  pipelines: Array<{ id: string; name: string }>;
}

export function SelectionHeader({
  selectedCount,
  onDelete,
  isDeleting,
  onMoveToPipeline,
  onChangeStatus,
  onAddVariables,
  pipelines,
}: SelectionHeaderProps) {
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 mb-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="font-medium">
          {selectedCount} lead{selectedCount !== 1 ? "s" : ""} selected
        </div>
        <div className="flex gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsBulkActionsOpen(true)}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
          
          <Button
            variant="subtleDanger"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <CircleX className="h-4 w-4 mr-2" />
            Delete Leads
          </Button>
        </div>
      </div>

      <BulkActionsDialog
        isOpen={isBulkActionsOpen}
        onOpenChange={setIsBulkActionsOpen}
        selectedCount={selectedCount}
        onDelete={onDelete}
        isDeleting={isDeleting}
        onMoveToPipeline={onMoveToPipeline}
        onChangeStatus={onChangeStatus}
        onAddVariables={onAddVariables}
        pipelines={pipelines}
      />
    </div>
  );
}
