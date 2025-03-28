import { useState, useEffect } from "react";
import { useLeads } from "@/hooks/use-leads";
import { Separator } from "@/components/ui/separator";
import { LeadsTable } from "@/components/leads/leads-table";
import { AddLeadDialog } from "@/components/leads/components/add-lead-dialog";
import { BulkImportDialog } from "@/components/leads/components/bulk-import/bulk-import-dialog";
import { SearchAndFilters } from "@/components/leads/components/search-and-filters";
import { EditLeadDialog } from "@/components/leads/components/edit-lead-dialog";
import { ImportProvider } from "@/context/import-context";
import { ImportsIndicator } from "@/components/leads/components/imports-indicator";
import { Tag } from "@/types/tag-types";

export interface LeadVariable {
  id: string;
  lead_id: string;
  name: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  pipeline_id: string;
  created_at: string;
  user_id: string;
  updated_at: string;
  source?: string;
  variables?: LeadVariable[];
  tags?: { id: string; name: string; color?: string; user_id?: string }[];
  onVariableClick?: (lead: Lead) => void;
  onEditClick?: (lead: Lead) => void;
}

export default function LeadsPage() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Use our new hook to manage all leads state and data fetching
  const {
    leads,
    totalCount,
    pipelines,
    availableTags,
    isLoading,
    isFetching,
    hasMoreLeads,
    loadMoreLeads,
    refreshLeads,
    selectedPipelineId,
    setSelectedPipelineId,
    searchQuery,
    setSearchQuery,
    selectedTagIds,
    setSelectedTagIds,
  } = useLeads();

  // Debug leads data
  useEffect(() => {
    console.log("🔍 Leads data in LeadsPage:", leads.length);
    console.log("🔍 First few leads:", leads.slice(0, 3));
  }, [leads]);

  // Setup event listener for editing leads
  useEffect(() => {
    const handleEditLead = (event: CustomEvent<Lead>) => {
      setEditingLead(event.detail);
    };

    window.addEventListener("editLead", handleEditLead as EventListener);

    return () => {
      window.removeEventListener("editLead", handleEditLead as EventListener);
    };
  }, []);

  // Handle edit lead directly
  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
  };

  return (
    <ImportProvider>
      <div className="flex flex-col h-screen">
        {/* Fixed header section - does not scroll */}
        <div className="flex-shrink-0 sticky top-0 z-40 bg-background pb-4">
          <SearchAndFilters
            selectedPipelineId={selectedPipelineId}
            setSelectedPipelineId={setSelectedPipelineId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            pipelines={pipelines}
            availableTags={availableTags}
            selectedTagIds={selectedTagIds}
            setSelectedTagIds={setSelectedTagIds}
            addLeadDialog={
              <div className="flex items-center space-x-2">
                <AddLeadDialog
                  isOpen={isNewLeadOpen}
                  onOpenChange={setIsNewLeadOpen}
                  onSuccess={refreshLeads}
                />

                <BulkImportDialog
                  isOpen={isBulkImportOpen}
                  onOpenChange={setIsBulkImportOpen}
                  onSuccess={refreshLeads}
                />
              </div>
            }
          />
        </div>

        {/* Scrollable content area - only this part scrolls */}
        <div className="flex-grow overflow-hidden">
          <div className="h-full">
            <LeadsTable
              leads={leads.map((lead) => ({
                ...lead,
                onVariableClick: handleEditLead,
                onEditClick: handleEditLead,
              }))}
              isLoading={isLoading}
              onLeadUpdated={refreshLeads}
              hasMore={hasMoreLeads}
              onLoadMore={async () => await loadMoreLeads()}
              pageSize={10}
              isFetching={isFetching}
              totalCount={totalCount}
              pipelines={pipelines}
            />
          </div>
        </div>

        {/* Fixed footer elements - do not scroll */}
        <div className="flex-shrink-0">
          <EditLeadDialog
            isOpen={!!editingLead}
            onOpenChange={(open) => !open && setEditingLead(null)}
            lead={editingLead}
            onSuccess={refreshLeads}
          />

          <ImportsIndicator />
        </div>
      </div>
    </ImportProvider>
  );
}
