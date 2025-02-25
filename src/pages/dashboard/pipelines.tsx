
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn, convertJsonToPipeline } from "@/types/pipeline";
import { useToast } from "@/components/ui/use-toast";
import { useDroppable } from "@dnd-kit/core";
import { DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PipelineHeader } from "@/components/pipelines/pipeline-header";
import { PipelineStages } from "@/components/pipelines/pipeline-stages";
import { LeadDetailsDialog } from "@/components/pipelines/lead-details-dialog";
import { Json } from "@/integrations/supabase/types";

const defaultColumns: PipelineColumn[] = [
  { id: "new", title: "New", color: "bg-blue-500" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-500" },
  { id: "qualified", title: "Qualified", color: "bg-green-500" },
  { id: "converted", title: "Converted", color: "bg-purple-500" },
  { id: "lost", title: "Lost", color: "bg-red-500" },
];

export function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="h-full">{children}</div>;
}

export default function PipelinesPage() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewPipelineDialog, setShowNewPipelineDialog] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [editingColumns, setEditingColumns] = useState(false);
  const [editedColumns, setEditedColumns] = useState<PipelineColumn[]>([]);

  const { data: pipelines = [], refetch: refetchPipelines } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(convertJsonToPipeline);
    },
  });

  const { data: leads = [], refetch: refetchLeads } = useQuery({
    queryKey: ["leads", selectedPipeline?.id],
    queryFn: async () => {
      if (!selectedPipeline?.id) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq('pipeline_id', selectedPipeline.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Lead[];
    },
    enabled: !!selectedPipeline?.id,
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = over.id as Lead["status"];

    // Don't update if dropping in the same column
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

      refetchLeads();
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const handleEditColumns = () => {
    if (!selectedPipeline) return;
    setEditedColumns([...selectedPipeline.columns]);
    setEditingColumns(true);
  };

  const handleSaveColumns = async () => {
    if (!selectedPipeline) return;

    try {
      const columnsJson = editedColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color,
      })) as Json;

      const { error: pipelineError } = await supabase
        .from("pipelines")
        .update({
          columns: columnsJson
        })
        .eq("id", selectedPipeline.id);

      if (pipelineError) throw pipelineError;

      toast({
        title: "Pipeline updated",
        description: "Pipeline stages have been updated successfully"
      });

      refetchPipelines();
      setEditingColumns(false);
      setSelectedPipeline(prev => prev ? { ...prev, columns: editedColumns } : null);
    } catch (error) {
      console.error("Error updating pipeline:", error);
      toast({
        title: "Error",
        description: "Failed to update pipeline stages",
        variant: "destructive"
      });
    }
  };

  const handleAddStage = (newStage: PipelineColumn) => {
    setEditedColumns(prev => [...prev, newStage]);
  };

  const handleEditColumnTitle = async (columnId: string, newTitle: string) => {
    const newColumns = [...editedColumns];
    const index = newColumns.findIndex(c => c.id === columnId);
    const oldTitle = newColumns[index].title;
    newColumns[index] = { ...newColumns[index], title: newTitle };
    setEditedColumns(newColumns);

    // Update the status of all leads in this stage
    const leadsInStage = leads.filter(lead => lead.status === columnId);
    if (leadsInStage.length > 0) {
      try {
        const { error } = await supabase
          .from("leads")
          .update({ status: newTitle })
          .eq("status", oldTitle);

        if (error) throw error;

        refetchLeads();
      } catch (error) {
        console.error("Error updating lead statuses:", error);
        toast({
          title: "Error",
          description: "Failed to update lead statuses",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditPipelineName = async (name: string) => {
    if (!selectedPipeline) return;

    try {
      const { error } = await supabase
        .from("pipelines")
        .update({ name })
        .eq("id", selectedPipeline.id);

      if (error) throw error;

      toast({
        title: "Pipeline updated",
        description: "Pipeline name has been updated successfully"
      });

      refetchPipelines();
      setSelectedPipeline(prev => prev ? { ...prev, name } : null);
    } catch (error) {
      console.error("Error updating pipeline name:", error);
      toast({
        title: "Error",
        description: "Failed to update pipeline name",
        variant: "destructive"
      });
    }
  };

  const createNewPipeline = async () => {
    if (!newPipelineName.trim()) return;

    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to create a pipeline",
        variant: "destructive",
      });
      return;
    }

    try {
      const columnsJson = defaultColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color,
      })) as Json;

      const { data, error } = await supabase
        .from("pipelines")
        .insert({
          name: newPipelineName,
          columns: columnsJson,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Pipeline created",
        description: "New pipeline has been created successfully",
      });

      setNewPipelineName("");
      setShowNewPipelineDialog(false);
      refetchPipelines();
      setSelectedPipeline(convertJsonToPipeline(data));
    } catch (error) {
      console.error("Error creating pipeline:", error);
      toast({
        title: "Error",
        description: "Failed to create pipeline",
        variant: "destructive",
      });
    }
  };

  const handleDeletePipeline = async () => {
    if (!selectedPipeline) return;

    try {
      const { error } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", selectedPipeline.id);

      if (error) throw error;

      toast({
        title: "Pipeline deleted",
        description: "Pipeline has been deleted successfully",
      });

      setSelectedPipeline(null);
      refetchPipelines();
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast({
        title: "Error",
        description: "Failed to delete pipeline",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-b from-background to-muted/50">
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
          editingColumns={editingColumns}
          editedColumns={editedColumns}
          onEditColumns={handleEditColumns}
          onSaveColumns={handleSaveColumns}
          onDragEnd={handleDragEnd}
          onEditColumnTitle={handleEditColumnTitle}
          onLeadClick={setSelectedLead}
          onAddStage={handleAddStage}
          onDeletePipeline={handleDeletePipeline}
          onEditPipelineName={handleEditPipelineName}
          onReorderColumns={setEditedColumns}
        />
      )}

      <Dialog open={showNewPipelineDialog} onOpenChange={setShowNewPipelineDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pipeline Name</Label>
              <Input
                id="name"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                placeholder="Enter pipeline name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPipelineDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createNewPipeline}>
              Create Pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadDetailsDialog
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        columns={selectedPipeline?.columns || defaultColumns}
      />
    </div>
  );
}
