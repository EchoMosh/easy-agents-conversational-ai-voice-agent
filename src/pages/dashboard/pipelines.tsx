import React, { useState, useEffect, useMemo, useCallback } from "react";
import { withErrorBoundary } from "@/components/error-boundary";
// import {
//   resetStuckDragAttributes,
//   createResetButton,
// } from "@/components/pipelines/components/kanban/reset-stuck-state"; // Functionality removed
import { useLocation, useNavigate } from "react-router-dom";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { PipelineHeader } from "@/components/pipelines/pipeline-header";
import { PipelineStages } from "@/components/pipelines/pipeline-stages";
import { LeadDetailsDialog } from "@/components/pipelines/lead-details-dialog";
import { NewPipelineDialog } from "@/components/pipelines/new-pipeline-dialog";
import { DeletePipelineDialog } from "@/components/pipelines/delete-pipeline-dialog";
import { usePipeline } from "@/hooks/use-pipeline";
// Import hooks directly - no conditional usage
import { defaultColumns } from "@/hooks/use-pipeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Completely rewritten with careful attention to hook rules
function PipelinesPage() {
  // Initialize all state up front to avoid conditional hook calls
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDragStuck, setIsDragStuck] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewColumnId, setPreviewColumnId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Location and navigation hooks
  const location = useLocation();
  const navigate = useNavigate();

  // Use a single combined hook for all pipeline functionality
  // This avoids potential issues with hook dependencies
  const {
    pipelines,
    leads,
    selectedPipeline,
    showNewPipelineDialog,
    setSelectedPipeline,
    setShowNewPipelineDialog,
    handleEditColumnTitle,
    handleEditPipelineName,
    handleDeletePipeline,
    createNewPipeline,
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,
  } = usePipeline();

  // Helper to persist columns array to the pipelines table
  const persistColumns = useCallback(
    async (pipelineId: string, columns: PipelineColumn[]) => {
      const columnsForDb = columns.map((col) => ({
        id: col.id,
        title: col.title,
        color: col.color,
      }));

      const { error } = await supabase
        .from("pipelines")
        .update({ columns: columnsForDb })
        .eq("id", pipelineId);

      if (error) throw error;
    },
    [],
  );

  // Event handlers - defined unconditionally
  const handleAddStage = useCallback(
    async (newStage: PipelineColumn) => {
      if (!selectedPipeline) return;

      const updatedColumns = [...(selectedPipeline.columns || []), newStage];

      // Update local state first for instant UI feedback
      setSelectedPipeline((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: updatedColumns,
        };
      });

      try {
        await persistColumns(selectedPipeline.id, updatedColumns);
        toast.success("New stage added");
      } catch (error) {
        console.error("Error persisting new stage:", error);
        // Revert local state on failure
        setSelectedPipeline((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            columns: selectedPipeline.columns,
          };
        });
        toast.error("Failed to save new stage");
      }
    },
    [selectedPipeline, setSelectedPipeline, persistColumns],
  );

  const handleReorderColumns = useCallback(
    async (newColumns: PipelineColumn[]) => {
      if (!selectedPipeline) return;

      const previousColumns = selectedPipeline.columns;

      // Update local state first for instant UI feedback
      setSelectedPipeline((prev) => {
        if (!prev) return null;
        return { ...prev, columns: newColumns };
      });

      try {
        await persistColumns(selectedPipeline.id, newColumns);
      } catch (error) {
        console.error("Error persisting column reorder:", error);
        // Revert local state on failure
        setSelectedPipeline((prev) => {
          if (!prev) return null;
          return { ...prev, columns: previousColumns };
        });
        toast.error("Failed to save column order");
      }
    },
    [selectedPipeline, setSelectedPipeline, persistColumns],
  );

  const handleDragOver = useCallback(
    (event: any) => {
      // Simplified drag over handler
      if (!event.over || !selectedPipeline) return;

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
    },
    [selectedPipeline],
  );

  const handleDragEnd = useCallback(
    async (event: any) => {
      if (!event.over || !selectedPipeline || isUpdating) {
        setPreviewColumnId(null);
        setPreviewIndex(null);
        return;
      }

      const activeData = event.active?.data?.current;
      const overData = event.over?.data?.current;

      // Only handle lead/task moves here — column reordering is handled by KanbanBoard
      if (activeData?.type === "Task" && activeData?.lead) {
        const lead = activeData.lead as Lead;
        const sourceColumnId = activeData.columnId as string;

        // Determine the target column
        let targetColumnId: string;
        if (overData?.type === "Column") {
          targetColumnId = String(event.over.id);
        } else if (overData?.type === "Task" && overData?.columnId) {
          targetColumnId = overData.columnId as string;
        } else {
          // No valid target — reset and bail
          setPreviewColumnId(null);
          setPreviewIndex(null);
          return;
        }

        // Find the target column to get its title (leads use status = column title)
        const targetColumn = selectedPipeline.columns.find(
          (col) => col.id === targetColumnId,
        );

        if (!targetColumn) {
          console.error("Target column not found:", targetColumnId);
          setPreviewColumnId(null);
          setPreviewIndex(null);
          return;
        }

        // Skip if the lead is already in this column
        if (sourceColumnId === targetColumnId) {
          setPreviewColumnId(null);
          setPreviewIndex(null);
          return;
        }

        setIsUpdating(true);

        try {
          // Update the lead's status to match the target column title
          const { error } = await supabase
            .from("leads")
            .update({ status: targetColumn.title })
            .eq("id", lead.id);

          if (error) throw error;

          // Reset preview state and refetch to reflect the change
          setPreviewColumnId(null);
          setPreviewIndex(null);
          await invalidateAndRefetch();
        } catch (error) {
          console.error("Error moving lead:", error);
          toast.error("Failed to move lead");
          setPreviewColumnId(null);
          setPreviewIndex(null);
          // Refetch to revert UI to actual DB state
          await invalidateAndRefetch();
        } finally {
          setIsUpdating(false);
        }

        return;
      }

      // For non-task drags (columns), just reset preview state
      setPreviewColumnId(null);
      setPreviewIndex(null);
    },
    [selectedPipeline, isUpdating, invalidateAndRefetch],
  );

  const resetDragState = useCallback(() => {
    setPreviewColumnId(null);
    setPreviewIndex(null);

    // Reset DOM attributes
    if (typeof document !== "undefined") {
      const stuckElements = document.querySelectorAll('[aria-pressed="true"]');
      stuckElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.setAttribute("aria-pressed", "false");
        }
      });

      const draggingElements = document.querySelectorAll(
        '[data-dragging="true"]',
      );
      draggingElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.removeAttribute("data-dragging");
        }
      });
    }
  }, []);

  // Handle delete functionality
  const onDelete = useCallback(
    async (option: "keep" | "move" | "delete", targetPipelineId?: string) => {
      if (!selectedPipeline) return;

      setIsDeleting(true);
      try {
        await handleDeletePipeline(selectedPipeline.id, targetPipelineId);
        setSelectedPipeline(null);
        setShowDeleteDialog(false);
        toast.success("Pipeline deleted successfully");
      } catch (error) {
        console.error("Error deleting pipeline:", error);
        toast.error("Failed to delete pipeline");
      } finally {
        setIsDeleting(false);
      }
    },
    [selectedPipeline, handleDeletePipeline],
  );

  // Initialize selectedPipeline if needed
  useEffect(() => {
    if (!pipelines || pipelines.length === 0) {
      return; // Skip if no pipelines yet
    }

    const params = new URLSearchParams(location.search);
    const selectedPipelineId = params.get("selected");

    if (selectedPipelineId) {
      const pipelineToSelect = pipelines.find(
        (p) => p.id === selectedPipelineId,
      );

      if (pipelineToSelect) {
        console.log(
          "Setting selected pipeline from URL parameter:",
          pipelineToSelect.name,
        );
        setSelectedPipeline(pipelineToSelect);
        return;
      }
    }

    if (!selectedPipeline && pipelines.length > 0) {
      setSelectedPipeline(pipelines[0]);
    }
  }, [pipelines, location.search, setSelectedPipeline, selectedPipeline]);

  // Reset button initialization (DOM operation, not a React element)
  useEffect(() => {
    // Only run this on mount
    if (typeof document !== "undefined") {
      // Safely add reset button using plain DOM methods
      // Runs after component mounts
      // setTimeout(() => {
      //   try {
      //     // createResetButton(); // Functionality removed
      //   } catch (e) {
      //     console.error("Error creating reset button:", e);
      //   }
      // }, 0);
    }
  }, []);

  // Stuck state detection
  useEffect(() => {
    if (typeof document === "undefined") return;

    const checkForStuckDrags = () => {
      try {
        const draggedElements = document.querySelectorAll(
          '[aria-pressed="true"]',
        );
        const isStuck = draggedElements.length > 0 && !isUpdating;

        if (isStuck) {
          console.log("Detected potentially stuck drag state");
          setIsDragStuck(true);
        } else {
          setIsDragStuck(false);
        }
      } catch (e) {
        console.error("Error checking for stuck drags:", e);
      }
    };

    const intervalId = setInterval(checkForStuckDrags, 5000);
    return () => clearInterval(intervalId);
  }, [isUpdating]);

  // Derived data that doesn't affect hooks
  const otherPipelines = useMemo(
    () => pipelines?.filter((p) => p.id !== selectedPipeline?.id) || [],
    [pipelines, selectedPipeline?.id],
  );

  const hasLeads = useMemo(
    () =>
      leads?.some((lead) => lead.pipeline_id === selectedPipeline?.id) || false,
    [leads, selectedPipeline?.id],
  );

  const pipelineColumns = useMemo(
    () =>
      selectedPipeline?.columns.map((col) => ({
        id: col.id,
        title: col.title,
        color: col.color || "bg-gray-500", // Default color if missing
      })) || defaultColumns,
    [selectedPipeline],
  );

  // Event handlers (defined outside of render to prevent recreation)
  const handleResetDragState = useCallback(() => {
    resetDragState();
    // resetStuckDragAttributes(); // Functionality removed
    invalidateAndRefetch();
    setIsDragStuck(false);
    toast.success("Drag state has been reset");
  }, [resetDragState, invalidateAndRefetch]);

  const handleSelectPipeline = useCallback(
    (pipeline: Pipeline) => {
      console.log("Pipeline selected:", pipeline.name);
      setSelectedPipeline(pipeline);
      navigate(`/dashboard/pipelines?selected=${pipeline.id}`, {
        replace: true,
      });

      // This forces a re-render with the updated pipeline selection
      setTimeout(() => {
        invalidateAndRefetch();
      }, 100);
    },
    [setSelectedPipeline, navigate, invalidateAndRefetch],
  );

  // Render function - now clean with minimal logic
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 md:px-6 pt-2 pb-1">
          <PipelineHeader
            pipelines={pipelines || []}
            selectedPipeline={selectedPipeline}
            onCreatePipeline={() => setShowNewPipelineDialog(true)}
            onSelectPipeline={handleSelectPipeline}
          />

          {isDragStuck && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleResetDragState}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
              >
                Reset Stuck Drag State
              </button>
            </div>
          )}
        </div>

        {selectedPipeline && (
          <div className="flex-1 overflow-hidden">
            <PipelineStages
              selectedPipeline={selectedPipeline}
              leads={leads || []}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              previewColumnId={previewColumnId}
              previewIndex={previewIndex}
              onEditColumnTitle={handleEditColumnTitle}
              onLeadClick={setSelectedLead}
              onAddStage={handleAddStage}
              onDeletePipeline={() => setShowDeleteDialog(true)}
              onEditPipelineName={handleEditPipelineName}
              onReorderColumns={handleReorderColumns}
              allPipelines={pipelines || []}
            />
          </div>
        )}

        <NewPipelineDialog
          open={showNewPipelineDialog}
          onOpenChange={setShowNewPipelineDialog}
          onSubmit={createNewPipeline}
        />

        <LeadDetailsDialog
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          columns={pipelineColumns}
        />

        <DeletePipelineDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onDelete={onDelete}
          isDeleting={isDeleting}
          hasLeads={hasLeads}
          otherPipelines={otherPipelines}
        />
      </div>
    </div>
  );
}

// Wrap with error boundary to prevent white screen on React errors
export default withErrorBoundary(PipelinesPage, {
  onError: (error, info) => {
    console.error("Pipeline page error:", error);
    console.error("Component stack:", info.componentStack);

    // Attempt to reset any stuck state
    if (typeof document !== "undefined") {
      try {
        // Reset stuck elements
        const stuckElements = document.querySelectorAll(
          '[aria-pressed="true"]',
        );
        stuckElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.setAttribute("aria-pressed", "false");
          }
        });

        // Clear any transforms
        const transformedElements = document.querySelectorAll(
          '[style*="transform"]',
        );
        transformedElements.forEach((el) => {
          if (el instanceof HTMLElement && el.hasAttribute("data-task-id")) {
            el.style.transform = "";
          }
        });
      } catch (e) {
        console.error("Failed to reset DOM state:", e);
      }
    }
  },
});
