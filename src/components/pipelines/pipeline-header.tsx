
import { Button } from "@/components/ui/button";
import { Plus, PlusCircle } from "lucide-react";
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
        <h1 className="text-3xl font-bold tracking-tight">
          Pipelines
        </h1>
        <Button
          onClick={onCreatePipeline}
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Pipeline
        </Button>
      </div>
      
      {pipelines.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          {pipelines.map((pipeline) => (
            <Button
              key={pipeline.id}
              variant={selectedPipeline?.id === pipeline.id ? "default" : "outline"}
              onClick={() => handlePipelineClick(pipeline)}
              size="sm"
              className={`
                font-medium rounded-full px-4 transition-all
                ${selectedPipeline?.id === pipeline.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-muted/50"}
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
