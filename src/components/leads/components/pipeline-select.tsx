
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pipeline } from "@/types/pipeline";

interface PipelineSelectProps {
  pipelines: Pipeline[];
  selectedPipelineId: string;
  onPipelineChange: (value: string) => void;
}

export function PipelineSelect({ pipelines, selectedPipelineId, onPipelineChange }: PipelineSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="pipeline" className="text-sm font-medium text-muted-foreground">Pipeline</Label>
      <Select value={selectedPipelineId} onValueChange={onPipelineChange} required>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a pipeline" />
        </SelectTrigger>
        <SelectContent>
          {pipelines.map((pipeline) => (
            <SelectItem key={pipeline.id} value={pipeline.id}>
              {pipeline.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
