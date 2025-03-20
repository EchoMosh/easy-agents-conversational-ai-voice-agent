
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Pipeline } from "@/types/pipeline";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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
    <div className="mb-8">
      {pipelines && pipelines.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {pipelines.map((pipeline) => (
              <Badge
                key={pipeline.id}
                variant={selectedPipeline?.id === pipeline.id ? "default" : "secondary"}
                className={`
                  px-4 py-2 text-sm font-medium cursor-pointer rounded-full transition-all
                  ${
                    selectedPipeline?.id === pipeline.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-secondary/80"
                  }
                `}
                onClick={() => handlePipelineClick(pipeline)}
              >
                {pipeline.name}
              </Badge>
            ))}
          </div>
          <Button onClick={onCreatePipeline}>
            <Plus className="mr-2 h-4 w-4" />
            New Pipeline
          </Button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Create your first pipeline to start managing leads.
          </p>
          <Button onClick={onCreatePipeline}>
            <Plus className="mr-2 h-4 w-4" />
            New Pipeline
          </Button>
        </div>
      )}
    </div>
  );
}
