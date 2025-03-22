
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BulkActionsDialog } from "@/components/leads/components/bulk-actions-dialog";
import { ClipboardCheck, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pipeline } from "@/types/pipeline";

interface SelectionHeaderProps {
  selectedCount: number;
  onDelete: () => void;
  isDeleting: boolean;
  onMoveToPipeline: (pipelineId: string) => void;
  onAddVariables: () => void;
  pipelines: Array<{ id: string; name: string }>;
}

export function SelectionHeader({
  selectedCount,
  onDelete,
  isDeleting,
  onMoveToPipeline,
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
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="subtleDanger"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="w-9 px-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Delete selected leads</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <BulkActionsDialog
        isOpen={isBulkActionsOpen}
        onOpenChange={setIsBulkActionsOpen}
        selectedLeadIds={Array(selectedCount).fill("")}
        onLeadsUpdated={() => {}}
        onAssignTags={async () => {}}
        onRemoveTags={async () => {}}
        onChangeStatus={async () => {}}
        onDeleteLeads={async () => onDelete()}
        onChangePipeline={async (leadIds, pipelineId) => onMoveToPipeline(pipelineId)}
        pipelines={pipelines}
      />
    </div>
  );
}
