
import { useState, useMemo } from "react";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline } from "@/types/pipeline";

export function useBoardColumns(pipeline: Pipeline, pipelineLeads: Lead[]) {
  // Get column IDs for SortableContext
  const columnsId = useMemo(() => 
    pipeline.columns.map((col) => col.id), 
  [pipeline.columns]);

  // Get leads for each column
  const getColumnLeads = (columnId: string) => {
    const column = pipeline.columns.find(col => col.id === columnId);
    if (!column?.title) return [];
    
    return pipelineLeads.filter(
      lead => lead.status && 
             column.title && 
             lead.status.toLowerCase() === column.title.toLowerCase()
    );
  };

  return {
    columnsId,
    getColumnLeads
  };
}
