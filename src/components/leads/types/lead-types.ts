
import { Lead } from "@/pages/dashboard/leads";

export interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadUpdated: () => void;
}

export const statusColors = {
  'New': "bg-blue-500",
  'Contacted': "bg-yellow-500",
  'Qualified': "bg-green-500",
  'Converted': "bg-purple-500",
  'Lost': "bg-red-500",
} as const;

export interface LeadRowProps {
  lead: Lead;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onLeadUpdated: () => void;
  isDeleting: boolean;
  pipelineName?: string;
}

export interface LeadTableHeaderProps {
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isDeleting: boolean;
}

export interface LeadActionsProps {
  lead: Lead;
  onEditSuccess: () => void;
}
