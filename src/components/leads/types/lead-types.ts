
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

// Extend Lead with optional click handlers
export interface LeadWithHandlers extends Lead {
  onVariableClick?: (lead: Lead) => void;
  onEditClick?: (lead: Lead) => void;
}

export interface LeadRowProps {
  lead: LeadWithHandlers;
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

// Update BulkActionsDialogProps to match the actual BulkActionsDialog implementation
export interface BulkActionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeads: Lead[];
  onAssignTags: (leadIds: string[], tagIds: string[]) => Promise<void>;
  onRemoveTags: (leadIds: string[], tagIds: string[]) => Promise<void>;
  onChangePipeline: (leadIds: string[], pipelineId: string) => Promise<void>;
  onChangeStatus: (leadIds: string[], status: string) => Promise<void>;
  onDeleteLeads: (leadIds: string[]) => Promise<void>;
  pipelines: Array<{ id: string; name: string }>;
}
