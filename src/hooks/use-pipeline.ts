
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Pipeline, PipelineColumn, convertJsonToPipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { Json } from "@/integrations/supabase/types";

export const defaultColumns: PipelineColumn[] = [
  { id: "new", title: "New", color: "bg-blue-500" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-500" },
  { id: "qualified", title: "Qualified", color: "bg-green-500" },
  { id: "converted", title: "Converted", color: "bg-purple-500" },
  { id: "lost", title: "Lost", color: "bg-red-500" },
];

export function usePipeline() {
  const { toast } = useToast();
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [editingColumns, setEditingColumns] = useState(false);
  const [editedColumns, setEditedColumns] = useState<PipelineColumn[]>([]);
  const [showNewPipelineDialog, setShowNewPipelineDialog] = useState(false);

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

  const handleEditColumnTitle = async (columnId: string, newTitle: string) => {
    const newColumns = [...editedColumns];
    const index = newColumns.findIndex(c => c.id === columnId);
    const oldTitle = newColumns[index].title;
    newColumns[index] = { ...newColumns[index], title: newTitle };
    setEditedColumns(newColumns);

    // Update the status of all leads in this stage
    const leadsInStage = leads.filter(lead => lead.status === oldTitle);
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

  const createNewPipeline = async (name: string) => {
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
          name,
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

  return {
    pipelines,
    leads,
    selectedPipeline,
    editingColumns,
    editedColumns,
    showNewPipelineDialog,
    setSelectedPipeline,
    setEditedColumns,
    setShowNewPipelineDialog,
    handleEditColumns,
    handleSaveColumns,
    handleEditColumnTitle,
    handleEditPipelineName,
    handleDeletePipeline,
    createNewPipeline,
  };
}
