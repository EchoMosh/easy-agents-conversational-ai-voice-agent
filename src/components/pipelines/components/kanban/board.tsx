import { useState, useEffect, useRef } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCorners } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { Column } from "./column";
import { Card } from "./card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ActiveItem } from '@/hooks/pipeline/use-pipeline-drag';

interface BoardProps {
  columns: PipelineColumn[];
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onColumnUpdate: (column: PipelineColumn) => Promise<void>;
  onLeadUpdate: (lead: Lead, newStatus: string) => Promise<void>;
  onColumnsReorder: (columns: PipelineColumn[]) => Promise<void>;
}

export function Board({ 
  columns, 
  leads, 
  onLeadClick, 
  onColumnUpdate, 
  onLeadUpdate,
  onColumnsReorder
}: BoardProps) {
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const queryClient = useQueryClient();
  const columnsRef = useRef<PipelineColumn[]>(columns);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    
    if (active.data.current?.type === 'column') {
      setIsReordering(true);
      setActiveItem({
        id: active.id,
        type: 'column',
        column: active.data.current.column,
      });
    } else if (active.data.current?.type === 'lead') {
      setActiveItem({
        id: active.id,
        type: 'lead',
        lead: active.data.current.lead,
        fromColumn: active.data.current.fromColumn,
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveItem(null);
      setIsReordering(false);
      return;
    }

    // Handle column reordering
    if (active.data.current?.type === 'column' && over.data.current?.type === 'column') {
      const oldIndex = columns.findIndex(col => col.id === active.id);
      const newIndex = columns.findIndex(col => col.id === over.id);
      
      if (oldIndex !== newIndex) {
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        
        try {
          await onColumnsReorder(newColumns);
          toast.success("Pipeline columns reordered");
        } catch (error) {
          console.error("Error reordering columns:", error);
          toast.error("Failed to reorder columns");
        }
      }
    }
    
    // Handle lead moving between columns
    if (active.data.current?.type === 'lead' && over.data.current?.type === 'column') {
      const lead = active.data.current.lead;
      const targetColumnId = over.id;
      const targetColumn = columns.find(col => col.id === targetColumnId);
      
      if (targetColumn && lead.status !== targetColumn.name) {
        try {
          const updatedLead = { ...lead, status: targetColumn.name };
          await onLeadUpdate(updatedLead, targetColumn.name);
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          queryClient.invalidateQueries({ queryKey: ['pipeline'] });
          
          toast.success(`Moved ${lead.name} to ${targetColumn.name}`);
        } catch (error) {
          console.error("Error moving lead:", error);
          toast.error("Failed to move lead");
        }
      }
    }
    
    setActiveItem(null);
    setIsReordering(false);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    
    // We only care about lead items being dragged over columns
    if (!over || active.data.current?.type !== 'lead' || over.data.current?.type !== 'column') {
      return;
    }
    
    const activeColumnId = active.data.current.fromColumn;
    const overColumnId = over.id;
    
    // If the lead is already in this column, do nothing
    if (activeColumnId === overColumnId) {
      return;
    }
  };

  const getColumnLeads = (columnName: string) => {
    return leads.filter(lead => lead.status === columnName);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        <SortableContext items={columns.map(col => col.id)}>
          {columns.map(column => (
            <Column
              key={column.id}
              column={column}
              leads={getColumnLeads(column.name)}
              onLeadClick={onLeadClick}
              onColumnUpdate={onColumnUpdate}
              isReordering={isReordering}
            />
          ))}
        </SortableContext>
      </div>
      
      <DragOverlay modifiers={[restrictToWindowEdges]}>
        {activeItem && activeItem.type === 'column' && activeItem.column && (
          <Column
            column={activeItem.column}
            leads={getColumnLeads(activeItem.column.name)}
            onLeadClick={onLeadClick}
            onColumnUpdate={onColumnUpdate}
            isOverlay
          />
        )}
        
        {activeItem && activeItem.type === 'lead' && activeItem.lead && (
          <Card lead={activeItem.lead} isOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}
