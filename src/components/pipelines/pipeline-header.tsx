import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Pipeline } from "@/types/pipeline";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PipelineHeaderProps {
  pipelines: Pipeline[];
  selectedPipeline: Pipeline | null;
  onSelectPipeline: (pipeline: Pipeline) => void;
  onCreatePipeline?: () => void;
}

export function PipelineHeader({
  pipelines,
  selectedPipeline,
  onSelectPipeline,
  onCreatePipeline,
}: PipelineHeaderProps) {
  const navigate = useNavigate();

  const handlePipelineClick = (pipeline: Pipeline) => {
    navigate(`/dashboard/pipelines?selected=${pipeline.id}`, { replace: true });
    onSelectPipeline(pipeline);
  };

  return (
    <div className="mb-4">
      {pipelines && pipelines.length > 0 ? (
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-1 border-b border-border">
            {pipelines.map((pipeline) => {
              const isSelected = selectedPipeline?.id === pipeline.id;
              return (
                <button
                  key={pipeline.id}
                  onClick={() => handlePipelineClick(pipeline)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap",
                    "hover:text-foreground focus-visible:outline-none",
                    isSelected
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground/80",
                  )}
                >
                  {pipeline.name}
                  {isSelected && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                  )}
                </button>
              );
            })}
          </div>
          <Button size="sm" variant="outline" onClick={onCreatePipeline}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Pipeline
          </Button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Create your first pipeline to start managing leads.
          </p>
          <Button size="sm" onClick={onCreatePipeline}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Pipeline
          </Button>
        </div>
      )}
    </div>
  );
}
