
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
    navigate(`/dashboard/pipelines?selected=${pipeline.id}`, { replace: true });
    onSelectPipeline(pipeline);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Pipelines
        </h1>
        <Button
          onClick={onCreatePipeline}
          size="sm"
          className="bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 rounded-full px-4 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Pipeline
        </Button>
      </div>
      
      {pipelines && pipelines.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {pipelines.map((pipeline) => (
            <Button
              key={pipeline.id}
              variant={selectedPipeline?.id === pipeline.id ? "subtle" : "clean"}
              onClick={() => handlePipelineClick(pipeline)}
              size="sm"
              className={`
                font-medium rounded-full px-4 transition-all
                ${selectedPipeline?.id === pipeline.id 
                  ? "bg-gray-100 dark:bg-gray-800 shadow-sm" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-900"}
              `}
            >
              {pipeline.name}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-3">
          Create your first pipeline to start managing leads.
        </p>
      )}
    </div>
  );
}
