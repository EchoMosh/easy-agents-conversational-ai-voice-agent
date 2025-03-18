import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { toast } from "sonner";

export function useStages(onReorderColumns: (columns: PipelineColumn[]) => void) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteStage = async (
    pipelineId: string,
    column: PipelineColumn,
    columns: PipelineColumn[],
    pipelineLeads: Lead[]
  ): Promise<void> => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // Remove the column from the columns array
      const updatedColumns = columns.filter((col) => col.id !== column.id);
      
      // Update the pipeline with the new columns
      // Convert columns to a format that Supabase can handle
      const columnsForDb = updatedColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color
      }));
      
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb,
        })
        .eq("id", pipelineId);
      
      if (error) throw error;
      
      // Update the local state
      onReorderColumns(updatedColumns);
      
      return;
    } catch (error) {
      console.error("Error deleting stage:", error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDeleteStage,
  };
}
