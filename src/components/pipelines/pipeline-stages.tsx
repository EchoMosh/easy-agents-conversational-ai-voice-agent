import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineName } from "./components/pipeline-name";
import { KanbanBoard } from "./components/kanban/KanbanBoard";

interface PipelineStagesProps {
  selectedPipeline: Pipeline;
  leads: Lead[];
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeleteStage: (column: PipelineColumn) => Promise<void>;
  onDeletePipeline: () => void;
  onEditPipelineName: (name: string) => void;
  onLeadMoved: () => void;
}

export function PipelineStages({
  selectedPipeline,
  leads,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onDeleteStage,
  onDeletePipeline,
  onEditPipelineName,
  onLeadMoved,
}: PipelineStagesProps) {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="px-4 flex-shrink-0">
        <PipelineName
          name={selectedPipeline.name}
          onEditPipelineName={onEditPipelineName}
          onDeletePipeline={onDeletePipeline}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          pipeline={selectedPipeline}
          leads={leads}
          onLeadClick={onLeadClick}
          onEditColumnTitle={onEditColumnTitle}
          onDeleteStage={onDeleteStage}
          onAddStage={onAddStage}
          onLeadMoved={onLeadMoved}
        />
      </div>
    </div>
  );
}
