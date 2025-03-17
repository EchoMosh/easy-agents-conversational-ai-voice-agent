
import { useState, useRef } from "react";
import {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  UniqueIdentifier,
  Active,
  Over,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";

export interface ActiveItem {
  id: UniqueIdentifier;
  type: "Column" | "Task";
}

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
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const pickedUpLeadColumn = useRef<string | null>(null);
  
  // Get leads for each column
  const getColumnLeads = (columnId: string) => {
    const column = pipeline.columns.find(col => col.id === columnId);
    if (!column?.title) return [];
    
    return leads.filter(
      lead => lead.status && 
             column.title && 
             lead.status.toLowerCase() === column.title.toLowerCase() &&
             lead.pipeline_id === pipeline.id
    );
  };

  // Helper function to get data about the dragging lead
  function getDraggingLeadData(leadId: UniqueIdentifier, columnId: string) {
    const leadsInColumn = getColumnLeads(columnId);
    const leadPosition = leadsInColumn.findIndex((lead) => lead.id === leadId);
    const column = pipeline.columns.find((col) => col.id === columnId);
    return {
      leadsInColumn,
      leadPosition,
      column,
    };
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (!active.data.current) return;
    
    const activeData = active.data.current;
    
    if (activeData.type === "Column") {
      setActiveItem({
        id: active.id,
        type: "Column",
      });
    } 
    else if (activeData.type === "Task") {
      setActiveItem({
        id: active.id,
        type: "Task",
      });
      
      // For tasks, we need to know which column they were picked up from
      pickedUpLeadColumn.current = activeData.columnId || activeData.task?.columnId || null;
      
      // For preview when dragging over columns
      const leadId = String(active.id);
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setPreviewLead(lead);
      }
    }
  };

  // Handle drag over - for reordering columns
  const handleDragOver = (event: DragOverEvent) => {
    if (onExternalDragOver) {
      onExternalDragOver(event);
    }
    
    const { active, over } = event;
    
    if (!over || !active.data.current || !over.data.current) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // If columns are being reordered
    if (activeData.type === "Column" && overData.type === "Column") {
      const activeColumnIndex = pipeline.columns.findIndex(col => col.id === activeId);
      const overColumnIndex = pipeline.columns.findIndex(col => col.id === overId);
      
      if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
        const newColumns = arrayMove(
          pipeline.columns,
          activeColumnIndex,
          overColumnIndex
        );
        
        onReorderColumns(newColumns);
      }
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    setPreviewLead(null);
    pickedUpLeadColumn.current = null;
    
    onExternalDragEnd(event);
  };

  return {
    activeItem,
    previewLead,
    pickedUpLeadColumn,
    getColumnLeads,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getDraggingLeadData,
  };
}
