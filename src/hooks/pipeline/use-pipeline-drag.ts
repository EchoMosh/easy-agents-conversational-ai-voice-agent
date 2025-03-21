import { DragEndEvent, DragOverEvent, UniqueIdentifier } from "@dnd-kit/core";
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { toast } from "sonner";

<<<<<<< HEAD
// Constants for drag preview behavior - reduced for better responsiveness
const DRAG_HYSTERESIS_TIME = 50; // ms to wait before switching targets (reduced from 150ms)
const DRAG_POSITION_THRESHOLD = 5; // px distance before considering a real move (reduced from 10px)
const DRAG_AREA_OVERLAP_THRESHOLD = 0.2; // 20% overlap to consider switching targets (reduced from 30%)

export function usePipelineDrag(selectedPipeline: Pipeline | null, leads: Lead[], refetchLeads: () => void) {
=======
export function usePipelineDrag(selectedPipeline?: Pipeline | null, leads?: Lead[], refetchLeads?: () => void) {
  const { toast } = useToast();
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewColumnId, setPreviewColumnId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  
<<<<<<< HEAD
  // Unified drag state tracking for stability with less aggressive thresholds
  const dragState = useRef({
    // Current preview target
    currentTargetId: null as string | null,
    currentTargetType: null as string | null,
    currentIndex: null as number | null,
    
    // Intent tracking
    lastTargetChangeTime: 0,
    lastMousePosition: { x: 0, y: 0 },
    
    // Animation frame request
    animationFrameId: null as number | null,
    
    // Stability counters - reduced for better responsiveness
    targetStabilityCounter: 0,
    consistentTargetThreshold: 1, // reduced from 2 to make it more responsive
    
    // State flags
    isDragActive: false,
    hasStateBeenReset: true,
  });
=======
  const lastDragTarget = useRef<{ type: string; id: string | null }>({ type: "", id: null });
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
  
  const updateTimeoutRef = useRef<number | null>(null);

  // Simpler helper to update preview state safely - more direct
  const updatePreviewState = useCallback((columnId: string | null, index: number | null) => {
    // Cancel any pending animation frame
    if (dragState.current.animationFrameId !== null) {
      cancelAnimationFrame(dragState.current.animationFrameId);
      dragState.current.animationFrameId = null;
    }
    
    // Schedule the update with minimal delay
    dragState.current.animationFrameId = requestAnimationFrame(() => {
      // Set preview state immediately
      setPreviewColumnId(columnId);
      setPreviewIndex(index);
      dragState.current.animationFrameId = null;
    });
  }, []);

  // Ensure complete reset of drag state - important for reliability
  const completeResetDragState = useCallback(() => {
    // Cancel any pending animations
    if (dragState.current.animationFrameId !== null) {
      cancelAnimationFrame(dragState.current.animationFrameId);
      dragState.current.animationFrameId = null;
    }
    
    // Clear preview state
    setPreviewColumnId(null);
    setPreviewIndex(null);
    setIsUpdating(false);
    
    // Reset all drag state completely
    dragState.current = {
      currentTargetId: null,
      currentTargetType: null,
      currentIndex: null,
      lastTargetChangeTime: 0,
      lastMousePosition: { x: 0, y: 0 },
      animationFrameId: null,
      targetStabilityCounter: 0,
      consistentTargetThreshold: 1,
      isDragActive: false,
      hasStateBeenReset: true,
    };
    
    // Also reset any timeouts
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, []);
  
<<<<<<< HEAD
  // Improved drag over handler with better responsiveness
  const handleDragOver = useCallback((event: DragOverEvent) => {
=======
  const handleDragOver = (event: DragOverEvent) => {
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
    const { active, over } = event;
    
    if (!over || !selectedPipeline) return;

<<<<<<< HEAD
    // Mark drag as active
    dragState.current.isDragActive = true;
    dragState.current.hasStateBeenReset = false;

    // Get data from the event
=======
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    const overId = String(over.id);
    
<<<<<<< HEAD
    // Only handle Task dragging
=======
    if (lastDragTarget.current.type === overType && lastDragTarget.current.id === overId) {
      return;
    }
    
    lastDragTarget.current = { type: overType || "", id: overId };
    
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
    if (activeType !== "Task") {
      return;
    }
    
<<<<<<< HEAD
    // Get current mouse position from the event
    const currentPosition = {
      x: event.activatorEvent ? (event.activatorEvent as MouseEvent).clientX : 0,
      y: event.activatorEvent ? (event.activatorEvent as MouseEvent).clientY : 0
    };
    
    // Calculate distance moved since last event
    const lastPos = dragState.current.lastMousePosition;
    const distance = Math.sqrt(
      Math.pow(currentPosition.x - lastPos.x, 2) + 
      Math.pow(currentPosition.y - lastPos.y, 2)
    );
    
    // Update last position
    dragState.current.lastMousePosition = currentPosition;
    
    // Apply a reduced movement threshold for better responsiveness
    if (distance < DRAG_POSITION_THRESHOLD) {
      // If below threshold but we already have a target, let it continue
      if (!dragState.current.currentTargetId) {
        return;
      }
    }
    
    // Check if the target has changed
    const hasTargetChanged = 
      dragState.current.currentTargetId !== overId || 
      dragState.current.currentTargetType !== overType;
      
    const now = Date.now();
    
    // If target has changed, apply minimal hysteresis
    if (hasTargetChanged) {
      // When target changes, only apply hysteresis for very short time
      if (now - dragState.current.lastTargetChangeTime < DRAG_HYSTERESIS_TIME) {
        // Allow through anyway if we've made a significant movement
        if (distance < DRAG_POSITION_THRESHOLD * 2) {
          return;
=======
    if (overType === "Column") {
      setTimeout(() => {
        if (lastDragTarget.current.type === "Column") {
          setPreviewColumnId(overId);
          setPreviewIndex(null);
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
        }
      }
      
      dragState.current.lastTargetChangeTime = now;
      dragState.current.targetStabilityCounter = 0;
    } else {
      // Same target, increment stability counter
      dragState.current.targetStabilityCounter++;
    }
    
    // More responsive update behavior
    if (dragState.current.targetStabilityCounter < dragState.current.consistentTargetThreshold) {
      // Allow updates anyway if we've been hovering in one spot long enough
      if (now - dragState.current.lastTargetChangeTime < 100) {
        return;
      }
    }
    
    // Update tracking state
    dragState.current.currentTargetId = overId;
    dragState.current.currentTargetType = overType || null;
    
    // Handle different target types with immediate feedback
    if (overType === "Column") {
      updatePreviewState(overId, null);
    } else if (overType === "Task") {
      const overColumnId = over.data?.current?.columnId;
      const overIndex = over.data?.current?.index;
      
      if (overColumnId) {
<<<<<<< HEAD
        updatePreviewState(overColumnId, typeof overIndex === 'number' ? overIndex : null);
=======
        setTimeout(() => {
          if (lastDragTarget.current.id === overId && lastDragTarget.current.type === "Task") {
            setPreviewColumnId(overColumnId);
            if (typeof overIndex === 'number') {
              setPreviewIndex(overIndex);
            }
          }
        }, 100);
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
      }
    }
  }, [selectedPipeline, updatePreviewState]);

  const handleDragEnd = async (event: DragEndEvent) => {
<<<<<<< HEAD
    const { active, over } = event;
    
    if (!over || !selectedPipeline || isUpdating) {
      completeResetDragState();
      return;
    }
    
    // Get data from the event
=======
    setPreviewColumnId(null);
    setPreviewIndex(null);
    lastDragTarget.current = { type: "", id: null };
    
    const { active, over } = event;
    
    if (!over || !selectedPipeline || isUpdating || !leads) return;

>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
    const activeId = String(active.id);
    const overId = String(over.id);
    
    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    
<<<<<<< HEAD
    // If we're not dragging a task, return
    if (activeType !== "Task") {
      completeResetDragState();
      return;
    }
=======
    if (activeType !== "Task") return;
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
    
    let targetColumnId = '';
    
    if (overType === "Column") {
      targetColumnId = overId;
    } else if (overType === "Task") {
      targetColumnId = over.data?.current?.columnId;
      if (!targetColumnId) {
        console.error("Target task has no column information", over.data?.current);
        completeResetDragState();
        return;
      }
    } else {
      console.error("Unknown drop target type:", overType);
      completeResetDragState();
      return;
    }
    
    const lead = leads.find(l => l.id === activeId);
    if (!lead) {
      console.error("Lead not found:", activeId);
      completeResetDragState();
      return;
    }

    const targetColumn = selectedPipeline?.columns.find(col => col.id === targetColumnId);
    if (!targetColumn) {
      console.error("Target column not found:", targetColumnId);
      completeResetDragState();
      return;
    }

    const newStatus = targetColumn.title;
    
    if (lead.status === newStatus && lead.pipeline_id === selectedPipeline?.id) {
      console.log("Lead already in the target status and pipeline");
      completeResetDragState();
      return;
    }

<<<<<<< HEAD
    // Keep preview state active while updating to prevent jumping
    // We'll rely on the refetch to clear this state
    
    // Set updating state to prevent multiple simultaneous updates
=======
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
    setIsUpdating(true);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = window.setTimeout(() => {
      setIsUpdating(false);
      completeResetDragState();
      updateTimeoutRef.current = null;
    }, 5000);

    try {
      console.log(`Moving lead ${activeId} to pipeline ${selectedPipeline?.id}, status ${newStatus}`);
      
<<<<<<< HEAD
      // Create an optimistic update to the lead for local state
      const updatedLead = {
        ...lead, 
        status: newStatus,
        pipeline_id: selectedPipeline.id
      };
      
      // Update the database
=======
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
      const { error } = await supabase
        .from("leads")
        .update({ 
          status: newStatus,
          pipeline_id: selectedPipeline?.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", activeId);

      if (error) throw error;

<<<<<<< HEAD
      // Show success toast after the update succeeds
      toast.success("Lead status updated", {
        description: `Lead moved to ${newStatus}`,
      });
      
      // Finally clear the drag state after successful update
      completeResetDragState();
      
      // Refetch leads to ensure UI is in sync with server state
      refetchLeads();
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Failed to update lead status");
      
      // Complete reset on error since we need to revert
      completeResetDragState();
      
      // Force refetch to revert to correct state in case of error
=======
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
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
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

<<<<<<< HEAD
  // Find and reset any stuck aria attributes in the DOM that might prevent future dragging
  const resetDOMState = useCallback(() => {
    // Find any elements with aria-pressed="true" and reset them
    const stuckElements = document.querySelectorAll('[aria-pressed="true"]');
    stuckElements.forEach(el => {
      if (el instanceof HTMLElement) {
        console.log('Resetting stuck aria-pressed element', el);
        el.setAttribute('aria-pressed', 'false');
      }
    });
=======
  const resetDragState = () => {
    setIsUpdating(false);
    setPreviewColumnId(null);
    setPreviewIndex(null);
    lastDragTarget.current = { type: "", id: null };
>>>>>>> 3f3a7f10ef0c2254c951369f3b63cc2e81f81b62
    
    // Find any elements with data-dragging="true" and reset them
    const draggingElements = document.querySelectorAll('[data-dragging="true"]');
    draggingElements.forEach(el => {
      if (el instanceof HTMLElement) {
        console.log('Resetting stuck data-dragging element', el);
        el.removeAttribute('data-dragging');
      }
    });
    
    // Try to remove any lingering transform styles
    const transformedElements = document.querySelectorAll('[style*="transform"]');
    transformedElements.forEach(el => {
      if (el instanceof HTMLElement && el.getAttribute('data-task-id')) {
        // Only reset transform for task elements
        console.log('Resetting stuck transform', el);
        el.style.transform = 'translate3d(0px, 0px, 0px)';
        el.style.transition = 'transform 0.1s ease';
      }
    });
  }, []);

  // Enhanced reset function with automatic stuck state detection
  const resetDragState = useCallback(() => {
    completeResetDragState();
    resetDOMState();
    console.log("Drag state forcibly reset");
  }, [completeResetDragState, resetDOMState]);
  
  // Auto-reset drag state if it gets stuck (after 5 seconds of inactivity while drag is active)
  useEffect(() => {
    if (!dragState.current.isDragActive || dragState.current.hasStateBeenReset) {
      return;
    }
    
    const checkStuckInterval = setInterval(() => {
      const now = Date.now();
      // If drag is active but we haven't updated in 5 seconds, force reset
      if (dragState.current.isDragActive && 
          now - dragState.current.lastTargetChangeTime > 5000) {
        console.log("Detected stuck drag state, auto-resetting");
        completeResetDragState();
        resetDOMState();
      }
    }, 1000);
    
    return () => clearInterval(checkStuckInterval);
  }, [completeResetDragState, resetDOMState]);

  // After a successful data update, ensure we force a delayed DOM state reset to clean up any straggling attributes
  useEffect(() => {
    // If the component just mounted, don't run this effect
    const isFirstRun = useRef(true);
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    
    // Reset DOM state on a delay to catch any stuck states after database updates
    const cleanupTimer = setTimeout(() => {
      resetDOMState();
    }, 1000);
    
    return () => clearTimeout(cleanupTimer);
  }, [leads, resetDOMState]); // Run this whenever leads change, which happens after DB updates

  return { 
    handleDragEnd, 
    handleDragOver, 
    isUpdating, 
    previewColumnId,
    previewIndex,
    resetDragState
  };
}
