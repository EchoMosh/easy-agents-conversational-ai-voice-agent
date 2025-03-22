
import { useState, useCallback } from 'react';
import { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Column, Task } from '@/types/pipeline-types';

export const usePipelineDrag = (
  pipelineId: string,
  initialColumns: Column[],
  onColumnsChange: (newColumns: Column[]) => void,
) => {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<UniqueIdentifier | null>(null);

  // Callback for updating task order in the UI
  const reorderTasks = useCallback(
    async (taskId: UniqueIdentifier, sourceColumnId: UniqueIdentifier, destinationColumnId: UniqueIdentifier, overId?: UniqueIdentifier) => {
      // Find source and destination columns
      const sourceColumn = initialColumns.find((col) => col.id === sourceColumnId);
      const destinationColumn = initialColumns.find((col) => col.id === destinationColumnId);

      if (!sourceColumn || !destinationColumn) {
        console.error('Source or destination column not found');
        return;
      }

      // Clone the columns array to avoid mutating state directly
      const updatedColumns = [...initialColumns];

      // Find the indexes of the source and destination columns
      const sourceColumnIndex = updatedColumns.findIndex((col) => col.id === sourceColumnId);
      const destinationColumnIndex = updatedColumns.findIndex((col) => col.id === destinationColumnId);

      // Clone the tasks arrays to avoid mutating state directly
      const sourceTasks = [...sourceColumn.tasks];
      let destinationTasks = sourceColumnId === destinationColumnId ? sourceTasks : [...destinationColumn.tasks];

      // Find the task we're moving
      const task = sourceTasks.find((t) => t.id === taskId);
      if (!task) {
        console.error('Task not found');
        return;
      }

      // Remove the task from the source column
      const sourceTaskIndex = sourceTasks.findIndex((t) => t.id === taskId);
      sourceTasks.splice(sourceTaskIndex, 1);

      // If we're dropping directly on another task, find its index
      const overIndex = overId ? destinationTasks.findIndex((t) => t.id === overId) : 0;

      // Add the task to the destination column
      if (overId) {
        destinationTasks.splice(overIndex, 0, task);
      } else {
        // If dropping on an empty column or at the end
        destinationTasks.push(task);
      }

      // Update the columns with the new tasks arrays
      updatedColumns[sourceColumnIndex] = {
        ...sourceColumn,
        tasks: sourceTasks,
      };

      if (sourceColumnId !== destinationColumnId) {
        updatedColumns[destinationColumnIndex] = {
          ...destinationColumn,
          tasks: destinationTasks,
        };
      }

      // Update the UI
      onColumnsChange(updatedColumns);

      // Update the task in the database
      try {
        // Update the task's column_id and position in the database
        const { error } = await supabase.from('pipeline_tasks').update({
          column_id: destinationColumnId,
          position: overIndex, // This assumes positions are 0-indexed
        }).eq('id', taskId);

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Error updating task in database:', error);
        toast({
          variant: 'destructive',
          title: 'Error updating task',
          description: 'The task could not be updated. Please try again.',
        });
      }
    },
    [initialColumns, onColumnsChange, toast]
  );

  // Callback for handling the end of a drag operation
  const handleDragEnd = useCallback(
    async (result: any) => {
      const { active, over } = result;

      if (!active || !over) {
        setActiveId(null);
        setActiveTask(null);
        setActiveColumnId(null);
        return;
      }

      // Extract the active item data
      const activeData = active.data.current;
      const overId = over.id;

      // If we're dragging a task
      if (activeData && activeData.type === 'task') {
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

        // Reorder the tasks
        await reorderTasks(id, columnId, destinationColumnId, overData?.type === 'task' ? overData.id : undefined);
      }
      // If we're dragging a column
      else if (activeData && activeData.type === 'column') {
        // Don't do anything if we're not over another column
        if (!over.data.current || over.data.current.type !== 'column') {
          setActiveId(null);
          setActiveColumnId(null);
          return;
        }

        // Find the indexes of the active and over columns
        const activeColumnIndex = initialColumns.findIndex((col) => col.id === active.id);
        const overColumnIndex = initialColumns.findIndex((col) => col.id === over.id);

        // Reorder the columns
        if (activeColumnIndex !== overColumnIndex) {
          const updatedColumns = arrayMove(initialColumns, activeColumnIndex, overColumnIndex);
          onColumnsChange(updatedColumns);

          // Update column positions in the database
          try {
            // Update each column's position in the database
            const updatePromises = updatedColumns.map((column, index) => 
              supabase.from('pipeline_columns').update({
                position: index,
              }).eq('id', column.id)
            );

            await Promise.all(updatePromises);
          } catch (error) {
            console.error('Error updating column positions in database:', error);
            toast({
              variant: 'destructive',
              title: 'Error updating columns',
              description: 'The columns could not be reordered. Please try again.',
            });
          }
        }
      }

      // Reset state
      setActiveId(null);
      setActiveTask(null);
      setActiveColumnId(null);
    },
    [initialColumns, onColumnsChange, reorderTasks, toast]
  );

  // Callback for handling the start of a drag operation
  const handleDragStart = useCallback((event: any) => {
    const { active } = event;
    const activeData = active.data.current;

    setActiveId(active.id);

    if (activeData && activeData.type === 'task') {
      // If dragging a task, find it in its column
      const column = initialColumns.find((col) => col.id === activeData.columnId);
      const task = column?.tasks.find((t) => t.id === active.id);
      
      if (task) {
        setActiveTask(task);
      }
    } else if (activeData && activeData.type === 'column') {
      // If dragging a column, set the active column ID
      setActiveColumnId(active.id);
    }
  }, [initialColumns]);

  return {
    activeId,
    activeTask,
    activeColumnId,
    handleDragStart,
    handleDragEnd,
  };
};
