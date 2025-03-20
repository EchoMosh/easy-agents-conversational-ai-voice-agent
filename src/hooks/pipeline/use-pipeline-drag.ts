
import { DragEndEvent, DragOverEvent, UniqueIdentifier } from "@dnd-kit/core";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { toast } from "sonner";

export function usePipelineDrag(selectedPipeline: Pipeline | null, leads: Lead[], refetchLeads: () => void) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewColumnId, setPreviewColumnId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  
  // Add a 'lastDragTarget' to track the last drag target type to prevent flickering
  const lastDragTarget = useRef<{ type: string; id: string | null }>({ type: "", id: null });
  
  // Track update timeout to ensure we can clear it properly
  const updateTimeoutRef = useRef<number | null>(null);
  
  // Handle drag over (preview)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !selectedPipeline) return;

    // Get data from the event
    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    const overId = String(over.id);
    
    // Skip processing if the event is the same as the last one to reduce flickering
    if (lastDragTarget.current.type === overType && lastDragTarget.current.id === overId) {
      return;
    }
    
    // Update the last drag target
    lastDragTarget.current = { type: overType || "", id: overId };
    
    // Only handle Task dragging
    if (activeType !== "Task") {
      return;
    }
    
    // Prioritize Column drops over Task drops to reduce flickering
    if (overType === "Column") {
      // Direct drop on column - with small delay to reduce flicker
      setTimeout(() => {
        if (lastDragTarget.current.type === "Column") {
          setPreviewColumnId(overId);
          // Reset index for drop at the end
          setPreviewIndex(null);
        }
      }, 50);
    } else if (overType === "Task") {
      // Dropping over another task - only update if stable for a moment
      const overColumnId = over.data?.current?.columnId;
      const overIndex = over.data?.current?.index;
      
      if (overColumnId) {
        setTimeout(() => {
          // Only update if we're still over the same task after the delay
          if (lastDragTarget.current.id === overId && lastDragTarget.current.type === "Task") {
            setPreviewColumnId(overColumnId);
            if (typeof overIndex === 'number') {
              setPreviewIndex(overIndex);
            }
          }
        }, 100);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    // Clear preview state and last drag target
    setPreviewColumnId(null);
    setPreviewIndex(null);
    lastDragTarget.current = { type: "", id: null };
    
    const { active, over } = event;
    
    if (!over || !selectedPipeline || isUpdating) return;

    // Get data from the event
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Get types from the data
    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    
    // If we're not dragging a task, return
    if (activeType !== "Task") return;
    
    // Find the target column - either directly if dropping on column, or from the task's column if dropping on task
    let targetColumnId = '';
    
    if (overType === "Column") {
      // Direct drop on column
      targetColumnId = overId;
    } else if (overType === "Task") {
      // Drop on another task - get its column
      targetColumnId = over.data?.current?.columnId;
      if (!targetColumnId) {
        console.error("Target task has no column information", over.data?.current);
        return;
      }
    } else {
      // Unknown drop target
      console.error("Unknown drop target type:", overType);
      return;
    }
    
    // Find the lead being dragged
    const lead = leads.find(l => l.id === activeId);
    if (!lead) {
      console.error("Lead not found:", activeId);
      return;
    }

    // Find the target column in the selected pipeline
    const targetColumn = selectedPipeline.columns.find(col => col.id === targetColumnId);
    if (!targetColumn) {
      console.error("Target column not found:", targetColumnId);
      return;
    }

    const newStatus = targetColumn.title;
    
    // Check if the lead is already in the target status and pipeline
    if (lead.status === newStatus && lead.pipeline_id === selectedPipeline.id) {
      console.log("Lead already in the target status and pipeline");
      return;
    }

    // Set updating state to prevent multiple simultaneous updates
    setIsUpdating(true);

    // Set a safety timeout to reset isUpdating state after 5 seconds if something goes wrong
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = window.setTimeout(() => {
      setIsUpdating(false);
      updateTimeoutRef.current = null;
    }, 5000);

    try {
      console.log(`Moving lead ${activeId} to pipeline ${selectedPipeline.id}, status ${newStatus}`);
      
      // Update the database
      const { error } = await supabase
        .from("leads")
        .update({ 
          status: newStatus,
          pipeline_id: selectedPipeline.id,
          updated_at: new Date().toISOString() // Add timestamp to ensure trigger fires
        })
        .eq("id", activeId);

      if (error) throw error;

      // Show success toast after the update succeeds
      toast({
        title: "Lead status updated",
        description: `Lead moved to ${newStatus}`,
      });
      
      // Refetch leads to ensure UI is in sync with server state
      refetchLeads();
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
      // Force refetch to revert to correct state in case of error
      refetchLeads();
    } finally {
      // Clear the safety timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      
      // Delay resetting isUpdating to prevent quick double-updates
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

  // Function to forcibly reset the drag state - can be called in emergency situations
  const resetDragState = () => {
    setIsUpdating(false);
    setPreviewColumnId(null);
    setPreviewIndex(null);
    lastDragTarget.current = { type: "", id: null };
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    console.log("Drag state forcibly reset");
  };

  return { 
    handleDragEnd, 
    handleDragOver, 
    isUpdating, 
    previewColumnId,
    previewIndex,
    resetDragState
  };
}
