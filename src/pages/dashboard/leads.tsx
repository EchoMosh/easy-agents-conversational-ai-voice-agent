import { useState, useEffect, useRef } from "react";
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
  // To solve the "Invalid hook call" error, we need to ensure all hooks are called unconditionally
  // at the top level of the component

  // State hooks
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Prevent potential hook violations by ensuring useLeads is always called
  // with the same parameters in the same order
  const leadsData = useLeads();

  // Extract values from the leadsData to make the code more readable
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
  } = leadsData;

  // Use a ref for logging instead of multiple useEffect calls with dependencies
  const prevLeadsLengthRef = useRef<number | null>(null);

  // Combine effects to reduce hook calls and potential timing issues
  useEffect(() => {
    // Effect 1: Debug leads data only when leads length changes
    if (prevLeadsLengthRef.current !== leads.length) {
      console.log("🔍 Leads data in LeadsPage:", leads.length);
      if (leads.length > 0) {
        console.log("🔍 First few leads:", leads.slice(0, 3));
      }
      prevLeadsLengthRef.current = leads.length;
    }

    // Effect 2: Setup event listener for editing leads
    const handleEditLeadEvent = (event: CustomEvent<Lead>) => {
      setEditingLead(event.detail);
    };

    window.addEventListener("editLead", handleEditLeadEvent as EventListener);

    return () => {
      window.removeEventListener(
        "editLead",
        handleEditLeadEvent as EventListener
      );
    };
  }, [leads]); // Combined dependency array to avoid excessive re-renders

// Handle edit lead directly
  const handleEditLead = (lead: Lead) => {
    console.log("🐛DEBUG handleEditLead argument:", lead);
    setEditingLead(lead);
  };

  return (
    <ImportProvider>
      <div className="flex flex-col h-full max-w-full">
        <div className="flex-shrink-0 py-4 px-4 border-b">
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

        <div className="flex-grow overflow-auto px-4 py-2">
          <LeadsTable
            leads={leads.map((lead) => ({
              ...lead,
              onVariableClick: handleEditLead,
              onEditClick: handleEditLead,
            }))}
            isLoading={isLoading}
            onLeadUpdated={refreshLeads}
            hasMore={hasMoreLeads}
            onLoadMore={async () => {
              loadMoreLeads();
              return Promise.resolve();
            }}
            pageSize={15} /* Match the hook's page size */
            isFetching={isFetching}
            totalCount={totalCount}
            pipelines={pipelines}
          />
        </div>

        {/* Fixed footer elements - do not scroll */}
        <div>
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
