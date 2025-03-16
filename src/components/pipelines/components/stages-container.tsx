
import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { PipelineStage } from "./pipeline-stage";
import { SortableStage } from "./sortable-stage";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { AddStageButton } from "./add-stage-button";
import { useStages } from "@/hooks/pipeline/use-stages";
import { DeleteStageDialog } from "./delete-stage-dialog";
import { toast } from "sonner";

interface StagesContainerProps {
  selectedPipeline: Pipeline;
  leads: Lead[];
  onDragEnd: (event: DragEndEvent) => void;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onReorderColumns: (newOrder: PipelineColumn[]) => void;
  allPipelines?: Pipeline[];
  onDeleteStage: (column: PipelineColumn) => Promise<void>;
}

export function StagesContainer({
  selectedPipeline,
  leads,
  onDragEnd,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onReorderColumns,
  allPipelines = [],
  onDeleteStage
}: StagesContainerProps) {
  const [stageToDelete, setStageToDelete] = useState<PipelineColumn | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    editingColumnId,
    setEditingColumnId,
    editingColumnTitle,
    setEditingColumnTitle,
    isColumnCollapsed,
    toggleColumnCollapse,
    handleKeyDown,
    handleColorChange,
    handleAddNewStage,
    isAddingStage
  } = useStages(onReorderColumns);

  const [pipelineLeads, setPipelineLeads] = useState<Lead[]>([]);
  
  // Re-filter leads whenever the selectedPipeline changes
  useEffect(() => {
    if (!selectedPipeline) return;
    
    const filteredLeads = leads.filter(
      lead => lead.pipeline_id === selectedPipeline.id
    );
    
    console.log(`Pipeline ${selectedPipeline.name} has ${filteredLeads.length} unique leads (out of ${leads.length} total leads)`);
    setPipelineLeads(filteredLeads);
  }, [selectedPipeline, leads]);

  // Log the unique columns in the pipeline
  useEffect(() => {
    if (!selectedPipeline?.columns) return;
    
    // Check for unique columns
    const uniqueColumnIds = new Set(selectedPipeline.columns.map(col => col.id));
    console.log(`Pipeline ${selectedPipeline.name} has ${uniqueColumnIds.size} unique columns`);
    
    // If there are duplicates, log them
    if (uniqueColumnIds.size !== selectedPipeline.columns.length) {
      console.warn(`Pipeline has duplicate columns: ${selectedPipeline.columns.length} total vs ${uniqueColumnIds.size} unique`);
      console.warn(selectedPipeline.columns.map(c => ({ id: c.id, title: c.title })));
    }
  }, [selectedPipeline]);
  
  console.log("Pipeline leads:", pipelineLeads.length, `(out of ${leads.length} total leads)`);
  
  // Get leads for each column - use case-insensitive comparison
  const getColumnLeads = (column: PipelineColumn) => {
    const columnLeads = pipelineLeads.filter(
      lead => lead.status && 
             column.title && 
             lead.status.toLowerCase() === column.title.toLowerCase()
    );
    
    console.log(`Column "${column.title}" has ${columnLeads.length} leads in pipeline ${selectedPipeline.id}`);
    return columnLeads;
  };

  if (!selectedPipeline?.columns?.length) {
    return <div>No stages found</div>;
  }

  const handleStageColorChange = (columnId: string, color: string) => {
    handleColorChange(selectedPipeline.id, columnId, color, selectedPipeline.columns);
  };

  const handleDeleteStageConfirm = async (column: PipelineColumn) => {
    if (!column) {
      toast.error("Cannot delete: Missing stage information");
      return;
    }
    
    setIsDeleting(true);
    try {
      console.log(`StagesContainer: Confirming deletion of stage ${column.title}`);
      await onDeleteStage(column);
      toast.success(`Stage "${column.title}" deleted successfully`);
      console.log(`StagesContainer: Stage ${column.title} deleted successfully`);
      setStageToDelete(null);
    } catch (error) {
      console.error("Error in handleDeleteStageConfirm:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete stage");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="pt-4">
      <DndContext 
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-1 pb-4 w-full">
          <SortableContext 
            items={selectedPipeline.columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {selectedPipeline.columns.map((column) => (
              <SortableStage key={column.id} id={column.id}>
                <PipelineStage
                  column={column}
                  columnLeads={getColumnLeads(column)}
                  isCollapsed={isColumnCollapsed(selectedPipeline.id, column.id)}
                  editingColumnId={editingColumnId}
                  editingColumnTitle={editingColumnTitle}
                  onEditColumnTitle={(e) => handleKeyDown(e, onEditColumnTitle)}
                  setEditingColumnTitle={setEditingColumnTitle}
                  handleColorChange={handleStageColorChange}
                  onDeleteStage={setStageToDelete}
                  toggleColumnCollapse={() => toggleColumnCollapse(selectedPipeline.id, column.id)}
                  setEditingColumnId={setEditingColumnId}
                  onLeadClick={onLeadClick}
                  allPipelines={allPipelines}
                  currentPipelineId={selectedPipeline.id}
                />
              </SortableStage>
            ))}
            <div className="flex items-center justify-center h-full">
              <AddStageButton 
                onAddStage={() => {
                  handleAddNewStage(
                    selectedPipeline.id, 
                    selectedPipeline.columns, 
                    onAddStage
                  );
                }}
                isLoading={isAddingStage}
              />
            </div>
          </SortableContext>
        </div>
      </DndContext>
      
      <DeleteStageDialog
        stageToDelete={stageToDelete}
        onClose={() => setStageToDelete(null)}
        onConfirm={handleDeleteStageConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
