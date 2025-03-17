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
import { useDebounce } from "@/hooks/use-debounce";

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
  const [isDraggingDisabled, setIsDraggingDisabled] = useState(false);
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
  
  const debouncedSetStageToDelete = useDebounce((stage: PipelineColumn | null) => {
    console.log("Setting stage to delete:", stage?.title);
    setStageToDelete(stage);
    
    setIsDraggingDisabled(!!stage);
  }, 50);
  
  useEffect(() => {
    if (!selectedPipeline) return;
    
    const filteredLeads = leads.filter(
      lead => lead.pipeline_id === selectedPipeline.id
    );
    
    console.log(`Pipeline ${selectedPipeline.name} has ${filteredLeads.length} unique leads (out of ${leads.length} total leads)`);
    setPipelineLeads(filteredLeads);
  }, [selectedPipeline, leads]);

  useEffect(() => {
    if (!selectedPipeline?.columns) return;
    
    const uniqueColumnIds = new Set(selectedPipeline.columns.map(col => col.id));
    console.log(`Pipeline ${selectedPipeline.name} has ${uniqueColumnIds.size} unique columns`);
    
    if (uniqueColumnIds.size !== selectedPipeline.columns.length) {
      console.warn(`Pipeline has duplicate columns: ${selectedPipeline.columns.length} total vs ${uniqueColumnIds.size} unique`);
      console.warn(selectedPipeline.columns.map(c => ({ id: c.id, title: c.title })));
    }
  }, [selectedPipeline]);
  
  const getColumnLeads = (column: PipelineColumn) => {
    if (!column?.title) return [];
    
    const columnLeads = pipelineLeads.filter(
      lead => lead.status && 
             column.title && 
             lead.status.toLowerCase() === column.title.toLowerCase()
    );
    
    return columnLeads;
  };

  if (!selectedPipeline?.columns?.length) {
    return <div>No stages found</div>;
  }

  const handleStageColorChange = (columnId: string, color: string) => {
    handleColorChange(selectedPipeline.id, columnId, color, selectedPipeline.columns);
  };

  const handleDeleteStageClick = (column: PipelineColumn) => {
    if (isDeleting) {
      console.log("Already processing a delete operation, please wait");
      return;
    }
    
    console.log(`Initiating delete for stage: ${column.title}`);
    
    const leadsInColumn = getColumnLeads(column);
    if (leadsInColumn.length > 0) {
      console.warn(`Cannot delete stage "${column.title}" with ${leadsInColumn.length} leads`);
      toast.error(`Cannot delete stage "${column.title}" with ${leadsInColumn.length} leads. Please move them first.`);
      return;
    }
    
    if (selectedPipeline.columns.length <= 1) {
      console.warn("Cannot delete the last stage in a pipeline");
      toast.error("Cannot delete the last stage in a pipeline");
      return;
    }
    
    debouncedSetStageToDelete(column);
  };

  const handleDeleteStageConfirm = async (column: PipelineColumn) => {
    if (!column) {
      toast.error("Cannot delete: Missing stage information");
      return;
    }
    
    if (isDeleting) {
      console.log("Already processing a delete operation, please wait");
      return;
    }
    
    setIsDeleting(true);
    try {
      console.log(`StagesContainer: Confirming deletion of stage ${column.title} (${column.id})`);
      await onDeleteStage(column);
      toast.success(`Stage "${column.title}" deleted successfully`);
      setStageToDelete(null);
    } catch (error) {
      console.error("Error in handleDeleteStageConfirm:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete stage");
    } finally {
      setIsDeleting(false);
      setIsDraggingDisabled(false);
      
      setTimeout(() => {
        setStageToDelete(null);
      }, 300);
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
              <SortableStage 
                key={column.id} 
                id={column.id}
                disabled={isDeleting || isDraggingDisabled}
              >
                <PipelineStage
                  column={column}
                  columnLeads={getColumnLeads(column)}
                  isCollapsed={isColumnCollapsed(selectedPipeline.id, column.id)}
                  editingColumnId={editingColumnId}
                  editingColumnTitle={editingColumnTitle}
                  onEditColumnTitle={(e) => handleKeyDown(e, onEditColumnTitle)}
                  setEditingColumnTitle={setEditingColumnTitle}
                  handleColorChange={handleStageColorChange}
                  onDeleteStage={handleDeleteStageClick}
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
        onClose={() => {
          console.log("Closing delete dialog");
          setStageToDelete(null);
          setIsDraggingDisabled(false);
        }}
        onConfirm={handleDeleteStageConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
