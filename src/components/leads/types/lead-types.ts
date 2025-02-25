
import { Lead } from "@/pages/dashboard/leads";

export interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadUpdated: () => void;
}

export const statusColors = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-green-500",
  converted: "bg-purple-500",
  lost: "bg-red-500",
} as const;

export interface LeadRowProps {
  lead: Lead;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onLeadUpdated: () => void;
  isDeleting: boolean;
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
