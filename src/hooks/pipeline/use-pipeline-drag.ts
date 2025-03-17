
import { DragEndEvent, DragOverEvent, UniqueIdentifier } from "@dnd-kit/core";
import { useState } from "react";
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

  // Handle drag over (preview)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !selectedPipeline) return;

    // Get data from the event
    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    
    console.log("Drag Over:", { 
      activeId: String(active.id),
      activeType, 
      overId: String(over.id), 
      overType,
      overData: over.data?.current
    });
    
    // If we're dragging a task over a column, show preview
    if (activeType === "Task") {
      if (overType === "Column") {
        // Direct drop on column
        setPreviewColumnId(String(over.id));
        // Reset index for drop at the end
        setPreviewIndex(null);
      } else if (overType === "Task") {
        // Dropping over another task
        const overColumnId = over.data?.current?.columnId;
        const overIndex = over.data?.current?.index;
        
        if (overColumnId) {
          setPreviewColumnId(overColumnId);
          if (typeof overIndex === 'number') {
            setPreviewIndex(overIndex);
          }
        }
      }
    } else {
      // Reset preview
      setPreviewColumnId(null);
      setPreviewIndex(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    // Clear preview state
    setPreviewColumnId(null);
    setPreviewIndex(null);
    
    const { active, over } = event;
    
    if (!over || !selectedPipeline || isUpdating) return;

    // Get data from the event
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Get types from the data
    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    
    console.log("Drag End:", { 
      activeId, 
      activeType, 
      overId, 
      overType,
      overData: over.data?.current
    });
    
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
      // Delay resetting isUpdating to prevent quick double-updates
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

  return { 
    handleDragEnd, 
    handleDragOver, 
    isUpdating, 
    previewColumnId,
    previewIndex 
  };
}
