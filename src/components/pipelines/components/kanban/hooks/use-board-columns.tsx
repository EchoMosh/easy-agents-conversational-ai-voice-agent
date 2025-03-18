import { useMemo } from "react";
import { Pipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

export function useBoardColumns(pipeline: Pipeline, pipelineLeads: Lead[]) {
  // Get all column IDs
  const columnsId = useMemo(() => {
    return pipeline.columns.map((col) => col.id);
  }, [pipeline.columns]);

  // Get leads for a specific column
  const getColumnLeads = (columnId: string) => {
    return pipelineLeads.filter((lead) => {
      const columnTitle = pipeline.columns.find(
        (col) => col.id === columnId
      )?.title;
      return lead.status === columnTitle;
    });
  };

  return {
    columnsId,
    getColumnLeads,
  };
}
