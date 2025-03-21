import { DragEndEvent, DragOverEvent, UniqueIdentifier } from "@dnd-kit/core";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { toast } from "sonner";

export function usePipelineDrag(selectedPipeline?: Pipeline | null, leads?: Lead[], refetchLeads?: () => void) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewColumnId, setPreviewColumnId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  
  const lastDragTarget = useRef<{ type: string; id: string | null }>({ type: "", id: null });
  
  const updateTimeoutRef = useRef<number | null>(null);
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !selectedPipeline) return;

    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    const overId = String(over.id);
    
    if (lastDragTarget.current.type === overType && lastDragTarget.current.id === overId) {
      return;
    }
    
    lastDragTarget.current = { type: overType || "", id: overId };
    
    if (activeType !== "Task") {
      return;
    }
    
    if (overType === "Column") {
      setTimeout(() => {
        if (lastDragTarget.current.type === "Column") {
          setPreviewColumnId(overId);
          setPreviewIndex(null);
        }
      }, 50);
    } else if (overType === "Task") {
      const overColumnId = over.data?.current?.columnId;
      const overIndex = over.data?.current?.index;
      
      if (overColumnId) {
        setTimeout(() => {
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
    setPreviewColumnId(null);
    setPreviewIndex(null);
    lastDragTarget.current = { type: "", id: null };
    
    const { active, over } = event;
    
    if (!over || !selectedPipeline || isUpdating || !leads) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    
    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    
    if (activeType !== "Task") return;
    
    let targetColumnId = '';
    
    if (overType === "Column") {
      targetColumnId = overId;
    } else if (overType === "Task") {
      targetColumnId = over.data?.current?.columnId;
      if (!targetColumnId) {
        console.error("Target task has no column information", over.data?.current);
        return;
      }
    } else {
      console.error("Unknown drop target type:", overType);
      return;
    }
    
    const lead = leads.find(l => l.id === activeId);
    if (!lead) {
      console.error("Lead not found:", activeId);
      return;
    }

    const targetColumn = selectedPipeline?.columns.find(col => col.id === targetColumnId);
    if (!targetColumn) {
      console.error("Target column not found:", targetColumnId);
      return;
    }

    const newStatus = targetColumn.title;
    
    if (lead.status === newStatus && lead.pipeline_id === selectedPipeline?.id) {
      console.log("Lead already in the target status and pipeline");
      return;
    }

    setIsUpdating(true);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = window.setTimeout(() => {
      setIsUpdating(false);
      updateTimeoutRef.current = null;
    }, 5000);

    try {
      console.log(`Moving lead ${activeId} to pipeline ${selectedPipeline?.id}, status ${newStatus}`);
      
      const { error } = await supabase
        .from("leads")
        .update({ 
          status: newStatus,
          pipeline_id: selectedPipeline?.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", activeId);

      if (error) throw error;

      toast({
        title: "Lead status updated",
        description: `Lead moved to ${newStatus}`,
      });
      
      refetchLeads();
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
      refetchLeads();
    } finally {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

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
