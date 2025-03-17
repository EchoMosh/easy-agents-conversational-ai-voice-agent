
import { useState, useRef } from "react";
import { UniqueIdentifier, DragStartEvent, DragMoveEvent } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";
import { hasDraggableData } from "../utils";

export function useDragState() {
  const [activeColumn, setActiveColumn] = useState<PipelineColumn | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [currentOver, setCurrentOver] = useState<UniqueIdentifier | null>(null);
  const pickedUpLeadColumn = useRef<string | null>(null);
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent, leads: Lead[]) => {
    if (!hasDraggableData(event.active)) return;
    
    const { active } = event;
    const data = active.data.current;
    
    if (data?.type === "Column") {
      setActiveColumn(data.column);
    } 
    else if (data?.type === "Task") {
      const taskId = String(active.id);
      const lead = leads.find(l => l.id === taskId);
      if (lead) {
        setActiveLead(lead);
        // Store the column ID for this lead
        pickedUpLeadColumn.current = data.columnId || data.task?.columnId;
      }
    }
  };

  // Handle drag move for additional feedback
  const handleDragMove = (event: DragMoveEvent) => {
    const { over } = event;
    
    if (!over) return;
    
    // Update current over element for visual feedback
    setCurrentOver(over.id);
  };

  const resetDragState = () => {
    setActiveColumn(null);
    setActiveLead(null);
    setCurrentOver(null);
    pickedUpLeadColumn.current = null;
  };

  return {
    activeColumn,
    activeLead,
    currentOver,
    pickedUpLeadColumn,
    handleDragStart,
    handleDragMove,
    resetDragState,
    setCurrentOver
  };
}
