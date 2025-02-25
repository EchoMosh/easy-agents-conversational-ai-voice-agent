
import { Pipeline, PipelineColumn } from "./pipeline";
import { Lead } from "@/pages/dashboard/leads";

export interface PipelineStagesProps {
  selectedPipeline: Pipeline;
  leads: Lead[];
  editingColumns: boolean;
  editedColumns: PipelineColumn[];
  onEditColumns: () => void;
  onSaveColumns: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeletePipeline: () => void;
  onEditPipelineName: (name: string) => void;
  onReorderColumns: (columns: PipelineColumn[]) => void;
}

export interface NewPipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}
