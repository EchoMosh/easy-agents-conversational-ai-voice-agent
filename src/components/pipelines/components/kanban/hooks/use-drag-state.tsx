import { useState, useRef } from "react";
import { DragStartEvent, DragMoveEvent, UniqueIdentifier } from "@dnd-kit/core";
import { Column } from "../BoardColumn";
import { Lead } from "@/pages/dashboard/leads";
import { hasDraggableData } from "../utils";

export function useDragState() {
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [currentOver, setCurrentOver] = useState<UniqueIdentifier | null>(null);
  const pickedUpLeadColumn = useRef<string | null>(null);

  const handleDragStart = (event: DragStartEvent, leads: Lead[]) => {
    if (!hasDraggableData(event.active)) return;

    const data = event.active.data.current;

    if (data?.type === "Column") {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === "Task") {
      // Find the lead from the task data
      const leadId = data.task.id;
      const lead = leads.find((l) => l.id === leadId);

      if (lead) {
        setActiveLead(lead);
        pickedUpLeadColumn.current = data.columnId;
      }
      return;
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { over } = event;
    if (over) {
      setCurrentOver(over.id);
    } else {
      setCurrentOver(null);
    }
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
    setCurrentOver,
  };
}
