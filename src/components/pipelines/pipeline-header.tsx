
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Pipeline } from "@/types/pipeline";
import { useNavigate } from "react-router-dom";

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
              <Button
                key={pipeline.id}
                variant={
                  selectedPipeline?.id === pipeline.id ? "subtle" : "clean"
                }
                onClick={() => handlePipelineClick(pipeline)}
                size="sm"
                className={`
                  font-medium rounded-full px-4 transition-all
                  ${
                    selectedPipeline?.id === pipeline.id
                      ? "bg-gray-100 dark:bg-gray-800 shadow-sm"
                      : "hover:bg-gray-50 dark:hover:bg-gray-900"
                  }
                `}
              >
                {pipeline.name}
              </Button>
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
