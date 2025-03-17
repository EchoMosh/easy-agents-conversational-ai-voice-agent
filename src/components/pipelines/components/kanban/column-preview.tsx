
import { Lead } from "@/pages/dashboard/leads";
import { TaskCard } from "./TaskCard";

interface ColumnPreviewProps {
  previewLead: Lead | null;
  columnId: string;
  previewIndex: number | null;
}

export function ColumnPreview({ previewLead, columnId, previewIndex }: ColumnPreviewProps) {
  if (!previewLead) return null;

  return (
    <div className="relative pb-1 animate-pulse">
      <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-md opacity-50" />
      <TaskCard
        lead={previewLead}
        columnId={columnId}
        isPreview={true}
        index={previewIndex !== null ? previewIndex : undefined}
      />
    </div>
  );
}
