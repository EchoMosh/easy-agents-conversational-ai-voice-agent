
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectionHeaderProps {
  selectedCount: number;
  onDelete: () => void;
  isDeleting: boolean;
  onMoveToPipeline?: (pipelineId: string) => void;
  pipelines?: Array<{ id: string; name: string; }>;
}

export function SelectionHeader({ 
  selectedCount, 
  onDelete, 
  isDeleting,
  onMoveToPipeline,
  pipelines = []
}: SelectionHeaderProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 flex items-center justify-between bg-muted p-4 rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount} lead{selectedCount > 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        {onMoveToPipeline && pipelines.length > 0 && (
          <Select onValueChange={onMoveToPipeline}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Move to pipeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
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
    </div>
  );
}
