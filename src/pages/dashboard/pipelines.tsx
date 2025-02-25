import { useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { useToast } from "@/hooks/use-toast";
import { PipelineHeader } from "@/components/pipelines/pipeline-header";
import { PipelineStages } from "@/components/pipelines/pipeline-stages";
import { LeadDetailsDialog } from "@/components/pipelines/lead-details-dialog";
import { NewPipelineDialog } from "@/components/pipelines/new-pipeline-dialog";
import { usePipeline } from "@/hooks/use-pipeline";
import { supabase } from "@/integrations/supabase/client";
import { PipelineColumn } from "@/types/pipeline";
import { defaultColumns } from "@/hooks/use-pipeline";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

export function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="h-full">{children}</div>;
}

export default function PipelinesPage() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    pipelines,
    leads,
    selectedPipeline,
    editedColumns,
    showNewPipelineDialog,
    setSelectedPipeline,
    setEditedColumns,
    setShowNewPipelineDialog,
    handleEditColumnTitle,
    handleEditPipelineName,
    handleDeletePipeline,
    createNewPipeline,
    refetchPipelines,
    refetchLeads,
  } = usePipeline();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchPipelines(), refetchLeads()]);
    } catch (error) {
      console.error("Error refreshing:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = over.id as Lead["status"];

    const lead = leads.find(l => l.id === leadId);
    if (lead?.status === newStatus) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Lead status updated",
        description: `Lead moved to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const handleAddStage = (newStage: PipelineColumn) => {
    setEditedColumns(prev => [...prev, newStage]);
  };

  const handleReorderColumns = async (newColumns: PipelineColumn[]) => {
    if (!selectedPipeline) return;
    
    try {
      setEditedColumns(newColumns);
      setSelectedPipeline(prev => prev ? { ...prev, columns: newColumns } : null);
    } catch (error) {
      console.error("Error updating columns:", error);
      toast({
        title: "Error",
        description: "Failed to update pipeline columns",
        variant: "destructive",
      });
    }
  };

  const onDelete = async () => {
    setIsDeleting(true);
    try {
      await handleDeletePipeline();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast({
        title: "Error",
        description: "Failed to delete pipeline",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <div className="p-8 min-h-screen bg-gradient-to-b from-background to-muted/50">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-8 h-8"
          >
            <Loader2 className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <PipelineHeader 
          pipelines={pipelines}
          selectedPipeline={selectedPipeline}
          onCreatePipeline={() => setShowNewPipelineDialog(true)}
          onSelectPipeline={setSelectedPipeline}
        />

        {selectedPipeline && (
          <PipelineStages
            selectedPipeline={selectedPipeline}
            leads={leads}
            onDragEnd={handleDragEnd}
            onEditColumnTitle={handleEditColumnTitle}
            onLeadClick={setSelectedLead}
            onAddStage={handleAddStage}
            onDeletePipeline={() => setShowDeleteDialog(true)}
            onEditPipelineName={handleEditPipelineName}
            onReorderColumns={handleReorderColumns}
          />
        )}

        <NewPipelineDialog
          open={showNewPipelineDialog}
          onOpenChange={setShowNewPipelineDialog}
          onSubmit={createNewPipeline}
        />

        <LeadDetailsDialog
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          columns={selectedPipeline?.columns || defaultColumns}
        />

        <Sheet open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <SheetContent side="right" className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Delete Pipeline</SheetTitle>
              <SheetDescription>
                Are you sure you want to delete this pipeline? This action cannot be undone.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter className="mt-4">
              <div className="flex justify-end gap-4 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={onDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
