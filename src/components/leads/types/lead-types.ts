
import { Lead } from "@/pages/dashboard/leads";

export interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  isFetching?: boolean;
  onLeadUpdated: () => void;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
  pageSize?: number;
  totalCount?: number;
  pipelines?: Array<{ id: string; name: string }>;
}

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
  selectAllMode?: 'visible' | 'all';
  visibleCount?: number;
  totalCount?: number | null;
  onSelectAllMatching?: () => void;
}

export interface LeadActionsProps {
  lead: Lead;
  onEditSuccess: () => void;
}

export interface BulkActionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeadIds: string[];
  onLeadsUpdated: () => void;
  selectedLeads?: any[];
  onAssignTags?: () => Promise<void>;
  onRemoveTags?: () => Promise<void>;
  onChangePipeline?: (leadIds: string[], pipelineId: string) => Promise<void>;
  onChangeStatus?: () => Promise<void>;
  onDeleteLeads?: () => Promise<void>;
  pipelines?: { id: string; name: string }[];
}

// Status color mapping for lead status badges
export const statusColors = {
  new: "bg-blue-500",
  contacted: "bg-purple-500",
  qualified: "bg-amber-500",
  converted: "bg-green-500",
  lost: "bg-red-500"
};
