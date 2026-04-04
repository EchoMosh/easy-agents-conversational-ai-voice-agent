import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { PipelineHeader } from "@/components/pipelines/pipeline-header";
import { PipelineStages } from "@/components/pipelines/pipeline-stages";
import { LeadDetailsDialog } from "@/components/pipelines/lead-details-dialog";
import { NewPipelineDialog } from "@/components/pipelines/new-pipeline-dialog";
import { DeletePipelineDialog } from "@/components/pipelines/delete-pipeline-dialog";
import { usePipeline, defaultColumns } from "@/hooks/use-pipeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function PipelinesPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

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
    invalidateAndRefetch,
  } = usePipeline();

  // Persist columns to DB
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

  const handleAddStage = useCallback(
    async (newStage: PipelineColumn) => {
      if (!selectedPipeline) return;
      const updatedColumns = [...selectedPipeline.columns, newStage];

      setSelectedPipeline((prev) =>
        prev ? { ...prev, columns: updatedColumns } : null,
      );

      try {
        await persistColumns(selectedPipeline.id, updatedColumns);
        toast.success("New stage added");
      } catch (error) {
        console.error("Error adding stage:", error);
        setSelectedPipeline((prev) =>
          prev ? { ...prev, columns: selectedPipeline.columns } : null,
        );
        toast.error("Failed to add stage");
      }
    },
    [selectedPipeline, setSelectedPipeline, persistColumns],
  );

  const handleDeleteStage = useCallback(
    async (column: PipelineColumn) => {
      if (!selectedPipeline) return;
      if (selectedPipeline.columns.length <= 1) {
        toast.error("Cannot delete the last stage");
        return;
      }

      const stageLeads = (leads || []).filter(
        (l) =>
          l.pipeline_id === selectedPipeline.id &&
          l.status?.toLowerCase() === column.title.toLowerCase(),
      );

      if (stageLeads.length > 0) {
        toast.error(
          `Cannot delete stage with ${stageLeads.length} leads. Move them first.`,
        );
        return;
      }

      const updatedColumns = selectedPipeline.columns.filter(
        (c) => c.id !== column.id,
      );

      setSelectedPipeline((prev) =>
        prev ? { ...prev, columns: updatedColumns } : null,
      );

      try {
        await persistColumns(selectedPipeline.id, updatedColumns);
        toast.success(`Stage "${column.title}" deleted`);
      } catch (error) {
        console.error("Error deleting stage:", error);
        setSelectedPipeline((prev) =>
          prev ? { ...prev, columns: selectedPipeline.columns } : null,
        );
        toast.error("Failed to delete stage");
      }
    },
    [selectedPipeline, setSelectedPipeline, leads, persistColumns],
  );

  const onDelete = useCallback(
    async (option: "keep" | "move" | "delete", targetPipelineId?: string) => {
      if (!selectedPipeline) return;
      setIsDeleting(true);
      try {
        await handleDeletePipeline(selectedPipeline.id, targetPipelineId);
        setSelectedPipeline(null);
        setShowDeleteDialog(false);
        toast.success("Pipeline deleted");
      } catch (error) {
        console.error("Error deleting pipeline:", error);
        toast.error("Failed to delete pipeline");
      } finally {
        setIsDeleting(false);
      }
    },
    [selectedPipeline, handleDeletePipeline, setSelectedPipeline],
  );

  // Auto-select pipeline from URL or first available
  useEffect(() => {
    if (!pipelines || pipelines.length === 0) return;

    const params = new URLSearchParams(location.search);
    const selectedId = params.get("selected");

    if (selectedId) {
      const found = pipelines.find((p) => p.id === selectedId);
      if (found) {
        setSelectedPipeline(found);
        return;
      }
    }

    if (!selectedPipeline && pipelines.length > 0) {
      setSelectedPipeline(pipelines[0]);
    }
  }, [pipelines, location.search, setSelectedPipeline, selectedPipeline]);

  const handleSelectPipeline = useCallback(
    (pipeline: Pipeline) => {
      setSelectedPipeline(pipeline);
      navigate(`/dashboard/pipelines?selected=${pipeline.id}`, {
        replace: true,
      });
    },
    [setSelectedPipeline, navigate],
  );

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
        color: col.color || "bg-gray-500",
      })) || defaultColumns,
    [selectedPipeline],
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 md:px-6 pt-2 pb-1">
        <PipelineHeader
          pipelines={pipelines || []}
          selectedPipeline={selectedPipeline}
          onCreatePipeline={() => setShowNewPipelineDialog(true)}
          onSelectPipeline={handleSelectPipeline}
        />
      </div>

      {selectedPipeline && (
        <div className="flex-1 overflow-hidden">
          <PipelineStages
            selectedPipeline={selectedPipeline}
            leads={leads || []}
            onEditColumnTitle={handleEditColumnTitle}
            onLeadClick={setSelectedLead}
            onAddStage={handleAddStage}
            onDeleteStage={handleDeleteStage}
            onDeletePipeline={() => setShowDeleteDialog(true)}
            onEditPipelineName={handleEditPipelineName}
            onLeadMoved={invalidateAndRefetch}
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
        onLeadUpdated={invalidateAndRefetch}
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
  );
}

export default PipelinesPage;
