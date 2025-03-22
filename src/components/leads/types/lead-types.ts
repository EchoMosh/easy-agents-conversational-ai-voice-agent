
import { Lead } from "@/pages/dashboard/leads";

export interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadUpdated: () => void;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
}

export interface LeadWithHandlers extends Lead {
  onVariableClick?: (lead: Lead) => void;
  onEditClick?: (lead: Lead) => void;
}
