
import { DragEndEvent } from "@dnd-kit/core";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineName } from "./components/pipeline-name";
import { StagesContainer } from "./components/stages-container";
import { useStages } from "@/hooks/pipeline/use-stages";
import { useToast } from "@/hooks/use-toast";

interface PipelineStagesProps {
  selectedPipeline: Pipeline;
  leads: Lead[];
  onDragEnd: (event: DragEndEvent) => void;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeletePipeline: () => void;
  onEditPipelineName: (name: string) => void;
  onReorderColumns: (newOrder: PipelineColumn[]) => void;
  allPipelines?: Pipeline[];
}

export function PipelineStages({
  selectedPipeline,
  leads,
  onDragEnd,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onDeletePipeline,
  onEditPipelineName,
  onReorderColumns,
  allPipelines = [],
}: PipelineStagesProps) {
  const { toast } = useToast();
  const {
    handleDeleteStage
  } = useStages(onReorderColumns);

  const handleDeleteStageClick = async (column: PipelineColumn) => {
    if (column && selectedPipeline) {
      try {
        await handleDeleteStage(selectedPipeline.id, column, selectedPipeline.columns, leads);
        toast({
          title: "Stage deleted",
          description: `${column.title} stage has been deleted successfully`
        });
      } catch (error) {
        // Show the actual error message from the deleteStage function
        if (error instanceof Error) {
          console.error("Error deleting stage:", error);
          toast({
            title: "Cannot delete stage",
            description: error.message || "Failed to delete stage",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to delete stage",
            variant: "destructive"
          });
        }
      }
    }
  };

  // Ensure selectedPipeline.columns has unique IDs before rendering
  const uniqueColumns = Array.from(
    new Map(selectedPipeline.columns.map(col => [col.id, col])).values()
  );

  // If we had duplicate columns, update the pipeline with unique columns
  if (uniqueColumns.length !== selectedPipeline.columns.length) {
    console.log(`Found duplicate columns in pipeline ${selectedPipeline.name}. Original: ${selectedPipeline.columns.length}, Unique: ${uniqueColumns.length}`);
    selectedPipeline.columns = uniqueColumns;
  }
  
  console.log(`Selected pipeline "${selectedPipeline.name}" (${selectedPipeline.id}) has ${leads.length} total leads`);

  return (
    <>
      <PipelineName
        name={selectedPipeline.name}
        onEditPipelineName={onEditPipelineName}
        onDeletePipeline={onDeletePipeline}
      />

      <StagesContainer
        selectedPipeline={selectedPipeline}
        leads={leads}
        onDragEnd={onDragEnd}
        onEditColumnTitle={onEditColumnTitle}
        onLeadClick={onLeadClick}
        onAddStage={onAddStage}
        onReorderColumns={onReorderColumns}
        allPipelines={allPipelines}
        onDeleteStage={handleDeleteStageClick}
      />
    </>
  );
}
