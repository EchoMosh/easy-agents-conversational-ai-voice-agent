
import { useState, useRef } from "react";
import { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";
import { hasDraggableData } from "../utils";
import { useToast } from "@/hooks/use-toast";

export type ActiveDragItem = {
  id: string;
  type: "Column" | "Task";
  data: any;
};

interface UseKanbanDragProps {
  pipeline: { id: string; columns: PipelineColumn[] };
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
  onReorderColumns
}: UseKanbanDragProps) {
  const [activeItem, setActiveItem] = useState<ActiveDragItem | null>(null);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const pickedUpLeadColumn = useRef<string | null>(null);
  const { toast } = useToast();

  // Get column leads
  const getColumnLeads = (columnId: string) => {
    const column = pipeline.columns.find(col => col.id === columnId);
    if (!column?.title) return [];
    
    return leads.filter(
      lead => lead.pipeline_id === pipeline.id && 
              lead.status && 
              column.title && 
              lead.status.toLowerCase() === column.title.toLowerCase()
    );
  };

  // Helper function to get data about the dragging lead
  function getDraggingLeadData(leadId: string, columnId: string) {
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
    if (!hasDraggableData(event.active)) return;
    
    const { active } = event;
    const data = active.data.current;
    
    if (data?.type === "Column") {
      setActiveItem({
        id: String(active.id),
        type: "Column",
        data: data
      });
    } 
    else if (data?.type === "Task") {
      const taskId = String(active.id);
      const lead = leads.find(l => l.id === taskId);
      if (lead) {
        setActiveItem({
          id: taskId,
          type: "Task",
          data: data
        });
        
        pickedUpLeadColumn.current = data.task.columnId;
      }
    }
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    // Call the external drag over handler if provided
    if (onExternalDragOver) {
      onExternalDragOver(event);
    }
    
    const { active, over } = event;
    
    if (!over || !hasDraggableData(active) || !hasDraggableData(over)) {
      setPreviewLead(null);
      return;
    }
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) {
      setPreviewLead(null);
      return;
    }
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // If columns are being reordered
    if (activeData?.type === "Column" && overData?.type === "Column") {
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
      setPreviewLead(null);
    }
    
    // If task is being dragged over a column, show preview
    if (activeData?.type === "Task" && overData?.type === "Column") {
      const leadId = String(activeId);
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        const targetColumn = pipeline.columns.find(col => col.id === overId);
        if (targetColumn) {
          setPreviewLead({
            ...lead,
            status: targetColumn.title || lead.status,
            pipeline_id: pipeline.id
          });
        }
      }
    } else if (activeData?.type === "Task" && overData?.type !== "Column") {
      // Not over a column, clear preview
      setPreviewLead(null);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    setPreviewLead(null);
    pickedUpLeadColumn.current = null;
    
    // Use the external handler for most cases
    onExternalDragEnd(event);
  };

  return {
    activeItem,
    previewLead,
    pickedUpLeadColumn: pickedUpLeadColumn.current,
    getColumnLeads,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getDraggingLeadData
  };
}
