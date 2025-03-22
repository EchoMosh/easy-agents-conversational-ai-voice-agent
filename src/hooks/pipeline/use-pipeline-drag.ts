
import { useState, useCallback } from 'react';
import { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PipelineColumn } from '@/types/pipeline';
import { Lead } from '@/pages/dashboard/leads';

// Simplified interface for our hook
export interface UsePipelineDragResult {
  activeId: UniqueIdentifier | null;
  activeTask: Lead | null;
  activeColumnId: UniqueIdentifier | null;
  isUpdating: boolean;
  previewColumnId: string | null;
  previewIndex: number | null;
  handleDragStart: (event: any) => void;
  handleDragEnd: (result: any) => Promise<void>;
  handleDragOver: (event: any) => void;
  resetDragState: () => void;
}

export const usePipelineDrag = (): UsePipelineDragResult => {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeTask, setActiveTask] = useState<Lead | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<UniqueIdentifier | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewColumnId, setPreviewColumnId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Handle drag over - set preview positions
  const handleDragOver = useCallback((event: any) => {
    if (!event.over) {
      setPreviewColumnId(null);
      setPreviewIndex(null);
      return;
    }

    const overId = String(event.over.id);
    const overType = event.over.data?.current?.type;

    if (overType === "Column") {
      setPreviewColumnId(overId);
      setPreviewIndex(null);
    } else if (overType === "Task") {
      const overColumnId = event.over.data?.current?.columnId;
      const overIndex = event.over.data?.current?.index;

      if (overColumnId) {
        setPreviewColumnId(overColumnId);
        setPreviewIndex(typeof overIndex === "number" ? overIndex : null);
      }
    }
  }, []);

  // Reset all drag state
  const resetDragState = useCallback(() => {
    setActiveId(null);
    setActiveTask(null);
    setActiveColumnId(null);
    setPreviewColumnId(null);
    setPreviewIndex(null);
    setIsUpdating(false);
  }, []);

  // Callback for handling the end of a drag operation
  const handleDragEnd = useCallback(
    async (result: any) => {
      const { active, over } = result;

      if (!active || !over) {
        resetDragState();
        return;
      }

      setIsUpdating(true);

      try {
        // Extract the active item data
        const activeData = active.data.current;
        const overId = over.id;

        // If we're dragging a task
        if (activeData && activeData.type === 'task' && activeData.lead) {
          const { id, columnId } = activeData;
          const overData = over.data.current;

          let destinationColumnId = columnId;

          // If dropping on another task, use its column ID
          if (overData && overData.type === 'task') {
            destinationColumnId = overData.columnId;
          }
          // If dropping on a column, use that column's ID
          else if (overData && overData.type === 'column') {
            destinationColumnId = overId;
          }

          // Find destination column to update lead status
          // This would be a database operation in a real application
          console.log(`Moving lead ${id} from column ${columnId} to ${destinationColumnId}`);
          
          // We would update lead status based on the column
          // In a real app with Supabase, you'd update the lead's status here
        }
        // If we're dragging a column
        else if (activeData && activeData.type === 'column') {
          // Don't do anything if we're not over another column
          if (!over.data.current || over.data.current.type !== 'column') {
            resetDragState();
            return;
          }

          // Column reordering logic
          console.log(`Reordering column ${active.id} relative to ${over.id}`);
          
          // In a real application, we would update column positions in the database
        }
      } catch (error) {
        console.error('Error updating positions:', error);
        toast({
          variant: 'destructive',
          title: 'Error updating positions',
          description: 'There was an error updating positions. Please try again.',
        });
      } finally {
        // Reset state
        resetDragState();
      }
    },
    [resetDragState, toast]
  );

  // Callback for handling the start of a drag operation
  const handleDragStart = useCallback((event: any) => {
    const { active } = event;
    const activeData = active.data.current;

    setActiveId(active.id);

    if (activeData && activeData.type === 'task' && activeData.lead) {
      setActiveTask(activeData.lead);
    } else if (activeData && activeData.type === 'column') {
      setActiveColumnId(active.id);
    }
  }, []);

  return {
    activeId,
    activeTask,
    activeColumnId,
    isUpdating,
    previewColumnId,
    previewIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    resetDragState,
  };
};
