
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pipeline } from "@/types/pipeline";

interface PipelineSelectProps {
  pipelines: Pipeline[];
  selectedPipelineId: string;
  onPipelineChange: (pipelineId: string) => void;
  refetchPipelines: () => void;
  required?: boolean;
}

export function PipelineSelect({
  pipelines,
  selectedPipelineId,
  onPipelineChange,
  refetchPipelines,
  required = true,
}: PipelineSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="pipeline" className="text-sm font-medium text-muted-foreground">
          {required ? "Pipeline" : "Pipeline (optional)"}
        </Label>
      </div>
      <div className="flex space-x-2">
        <Select
          value={selectedPipelineId}
          onValueChange={onPipelineChange}
        >
          <SelectTrigger
            id="pipeline"
            className="flex-1 h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
          >
            <SelectValue placeholder="Select a pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.length === 0 ? (
              <SelectItem value="no-pipelines" disabled>
                No pipelines found
              </SelectItem>
            ) : (
              pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
