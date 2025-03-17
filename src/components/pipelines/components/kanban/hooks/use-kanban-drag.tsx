
import { useState, useRef, useCallback } from "react";
import { 
  DragEndEvent, 
  DragOverEvent, 
  DragStartEvent, 
  UniqueIdentifier 
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";

export type ActiveDragItem = {
  id: UniqueIdentifier;
  type: "Column" | "Task";
};

interface UseKanbanDragProps {
  pipeline: Pipeline;
  leads: Lead[];
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onReorderColumns: (columns: PipelineColumn[]) => void;
}

export function useKanbanDrag({
  pipeline,
  leads,
  onDragEnd: onExternalDragEnd,
  onDragOver: onExternalDragOver,
  onReorderColumns,
}: UseKanbanDragProps) {
  const [activeItem, setActiveItem] = useState<ActiveDragItem | null>(null);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const pickedUpLeadColumn = useRef<string | null>(null);

  // Filter leads for the current pipeline
  const pipelineLeads = leads.filter(lead => lead.pipeline_id === pipeline.id);

  // Get leads for a specific column
  const getColumnLeads = useCallback((columnId: string) => {
    const column = pipeline.columns.find(col => col.id === columnId);
    if (!column?.title) return [];
    
    return pipelineLeads.filter(
      lead => lead.status && 
             column.title && 
             lead.status.toLowerCase() === column.title.toLowerCase()
    );
  }, [pipeline.columns, pipelineLeads]);

  // Helper function to get data about the dragging lead
  const getDraggingLeadData = useCallback((leadId: UniqueIdentifier, columnId: string) => {
    const leadsInColumn = getColumnLeads(columnId);
    const leadPosition = leadsInColumn.findIndex((lead) => lead.id === leadId);
    const column = pipeline.columns.find((col) => col.id === columnId);
    return {
      leadsInColumn,
      leadPosition,
      column,
    };
  }, [getColumnLeads, pipeline.columns]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    
    // Check for Column type drag
    if (active.data?.current?.type === "Column") {
      setActiveItem({
        id: active.id,
        type: "Column",
      });
      return;
    } 
    
    // Check for Task/Lead type drag
    if (active.data?.current?.type === "Task") {
      const taskColumnId = active.data.current.columnId || active.data.current.task?.columnId;
      
      if (taskColumnId) {
        // Store the column ID that the lead is being picked up from
        pickedUpLeadColumn.current = taskColumnId;
      }
      
      setActiveItem({
        id: active.id,
        type: "Task",
      });
      
      // If it's a lead, create a preview version
      const leadId = String(active.id);
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setPreviewLead(lead);
      }
    }
  }, [leads]);

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Call external drag over handler if provided
    if (onExternalDragOver) {
      onExternalDragOver(event);
    }
    
    const { active, over } = event;
    
    if (!active || !over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    // Get data types
    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    
    // Handle column reordering
    if (activeType === "Column" && overType === "Column") {
      const activeColumnIndex = pipeline.columns.findIndex(col => col.id === activeId);
      const overColumnIndex = pipeline.columns.findIndex(col => col.id === overId);
      
      if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
        // Create a new array with the updated order
        const newColumns = arrayMove(
          pipeline.columns,
          activeColumnIndex,
          overColumnIndex
        );
        
        // Update the pipeline with the new column order
        onReorderColumns(newColumns);
      }
    }
  }, [pipeline.columns, onReorderColumns, onExternalDragOver]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    // Reset active states
    setActiveItem(null);
    setPreviewLead(null);
    pickedUpLeadColumn.current = null;
    
    // Forward to external handler
    onExternalDragEnd(event);
  }, [onExternalDragEnd]);

  return {
    activeItem,
    previewLead,
    pickedUpLeadColumn,
    getColumnLeads,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getDraggingLeadData
  };
}
