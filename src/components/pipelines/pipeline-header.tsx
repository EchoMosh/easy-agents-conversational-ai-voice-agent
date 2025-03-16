
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Pipeline } from "@/types/pipeline";
import { useNavigate } from "react-router-dom";

interface PipelineHeaderProps {
  pipelines: Pipeline[];
  selectedPipeline: Pipeline | null;
  onCreatePipeline: () => void;
  onSelectPipeline: (pipeline: Pipeline) => void;
}

export function PipelineHeader({ 
  pipelines, 
  selectedPipeline, 
  onCreatePipeline, 
  onSelectPipeline 
}: PipelineHeaderProps) {
  const navigate = useNavigate();

  const handlePipelineClick = (pipeline: Pipeline) => {
    // Update the URL with the selected pipeline ID
    navigate(`/dashboard/pipelines?selected=${pipeline.id}`, { replace: true });
    // Call the selection handler
    onSelectPipeline(pipeline);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Pipelines
        </h1>
        <Button
          onClick={onCreatePipeline}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Pipeline
        </Button>
      </div>
      {pipelines.length > 0 ? (
        <div className="flex items-center gap-4 mt-4">
          {pipelines.map((pipeline) => (
            <Button
              key={pipeline.id}
              variant={selectedPipeline?.id === pipeline.id ? "default" : "outline"}
              onClick={() => handlePipelineClick(pipeline)}
              className="gap-2"
            >
              {pipeline.name}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 text-lg">
          Create your first pipeline to start managing leads.
        </p>
      )}
    </div>
  );
}
