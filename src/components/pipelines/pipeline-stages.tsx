
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineName } from "./components/pipeline-name";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KanbanBoard } from "./components/kanban/KanbanBoard";
import { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { AddStageButton } from "./components/add-stage-button";
import { useStages } from "@/hooks/pipeline/use-stages";

interface PipelineStagesProps {
  selectedPipeline: Pipeline;
  leads: Lead[];
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  previewColumnId?: string | null;
  previewIndex?: number | null;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeletePipeline: () => void;
  onEditPipelineName: (name: string) => void;
  onReorderColumns: (newOrder: PipelineColumn[]) => void;
  allPipelines?: Pipeline[];
}

export function PipelineStages({
  selectedPipeline,
  leads,
  onDragEnd,
  onDragOver,
  previewColumnId,
  previewIndex,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onDeletePipeline,
  onEditPipelineName,
  onReorderColumns,
  allPipelines = [],
}: PipelineStagesProps) {
  const { handleDeleteStage } = useStages(onReorderColumns);
  const [cleanedPipeline, setCleanedPipeline] = useState<Pipeline | null>(null);
  const [isAddingStage, setIsAddingStage] = useState(false);

  // Check if we have a valid pipeline before proceeding
  if (!selectedPipeline) {
    console.warn("No pipeline selected");
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <p className="text-muted-foreground">
          No pipeline selected yet. Please select a pipeline to view its stages.
        </p>
      </div>
    );
  }

  // Ensure unique columns in the pipeline every time it changes
  useEffect(() => {
    if (!selectedPipeline) return;

    // Deduplicate columns by ID
    const uniqueColumnsMap = new Map();
    selectedPipeline.columns.forEach((col) =>
      uniqueColumnsMap.set(col.id, col)
    );
    const uniqueColumns = Array.from(uniqueColumnsMap.values());

    // Check if cleanup is needed
    if (uniqueColumns.length !== selectedPipeline.columns.length) {
      console.warn(
        `Fixing duplicate columns in pipeline ${selectedPipeline.name}. Original: ${selectedPipeline.columns.length}, Unique: ${uniqueColumns.length}`
      );

      // Create a cleaned version of the pipeline with unique columns
      setCleanedPipeline({
        ...selectedPipeline,
        columns: uniqueColumns,
      });

      // Optionally save the clean version back to the database
      saveDedupedColumnsToDatabase(selectedPipeline.id, uniqueColumns);
    } else {
      setCleanedPipeline(selectedPipeline);
    }
  }, [selectedPipeline]);

  // Helper function to save deduplicated columns to the database
  const saveDedupedColumnsToDatabase = async (
    pipelineId: string,
    uniqueColumns: PipelineColumn[]
  ) => {
    try {
      const columnsForDb = uniqueColumns.map((col) => ({
        id: col.id,
        title: col.title,
        color: col.color,
      }));

      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb,
        })
        .eq("id", pipelineId);

      if (error) throw error;

      console.log("Successfully saved deduplicated columns to database");
    } catch (error) {
      console.error("Error saving deduplicated columns:", error);
    }
  };

  const handleDeleteStageClick = async (
    column: PipelineColumn
  ): Promise<void> => {
    if (!column || !cleanedPipeline) {
      console.error("Invalid deletion: missing column or pipeline", {
        column,
        pipelineId: cleanedPipeline?.id,
      });
      toast.error("Cannot delete: missing stage or pipeline details");
      throw new Error("Cannot delete: missing column or pipeline details");
    }

    try {
      console.log(
        `PipelineStages: Attempting to delete stage "${column.title}" (${column.id})`
      );

      // Check if this is the last stage
      if (cleanedPipeline.columns.length <= 1) {
        const error = "Cannot delete the last stage in a pipeline";
        toast.error(error);
        throw new Error(error);
      }

      // Get only the leads for this pipeline
      const pipelineLeads = leads.filter(
        (lead) => lead.pipeline_id === cleanedPipeline.id
      );
      console.log(
        `Found ${pipelineLeads.length} leads in pipeline ${cleanedPipeline.id}`
      );

      // Check if there are leads in this stage
      const leadsInStage = pipelineLeads.filter(
        (lead) =>
          lead.status &&
          column.title &&
          lead.status.toLowerCase() === column.title.toLowerCase()
      );

      if (leadsInStage.length > 0) {
        const error = `Cannot delete stage with ${leadsInStage.length} leads. Move them first.`;
        toast.error(error);
        throw new Error(error);
      }

      await handleDeleteStage(
        cleanedPipeline.id,
        column,
        cleanedPipeline.columns,
        pipelineLeads
      );
      console.log(
        `PipelineStages: Stage "${column.title}" deleted successfully`
      );

      // Toast confirmation
      toast.success(`Stage "${column.title}" deleted successfully`);
      return;
    } catch (error) {
      console.error("PipelineStages: Error deleting stage:", error);
      toast.error(
        `Failed to delete stage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error; // Re-throw to let the dialog component handle display
    }
  };

  // If we don't have a cleaned pipeline yet, show loading
  if (!cleanedPipeline) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <p className="text-muted-foreground">Loading pipeline data...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PipelineName
        name={cleanedPipeline.name}
        onEditPipelineName={onEditPipelineName}
        onDeletePipeline={onDeletePipeline}
      />

      <div className="mt-4 flex-1 overflow-hidden">
        <KanbanBoard
          pipeline={cleanedPipeline}
          leads={leads}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          previewColumnId={previewColumnId}
          previewIndex={previewIndex}
          onEditColumnTitle={onEditColumnTitle}
          onLeadClick={onLeadClick}
          onAddStage={(stage) => {
            setIsAddingStage(true);
            onAddStage(stage);
            setTimeout(() => setIsAddingStage(false), 1000);
          }}
          onDeleteStage={handleDeleteStageClick}
          onReorderColumns={onReorderColumns}
          isAddingStage={isAddingStage}
        />
      </div>
    </div>
  );
}
