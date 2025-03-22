import { useState, useEffect } from "react";
import { usePipelineQueries } from "@/hooks/pipeline/use-pipeline-queries";
import { Separator } from "@/components/ui/separator";
import { LeadsTable } from "@/components/leads/leads-table";
import { AddLeadDialog } from "@/components/leads/components/add-lead-dialog";
import { BulkImportDialog } from "@/components/leads/components/bulk-import/bulk-import-dialog";
import { SearchAndFilters } from "@/components/leads/components/search-and-filters";
import { LeadEditForm } from "@/components/leads/components/lead-edit-form";
import { ImportProvider } from "@/context/import-context";
import { ImportsIndicator } from "@/components/leads/components/imports-indicator";

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
}

export default function LeadsPage() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState<
    string | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { 
    pipelines, 
    leads, 
    availableTags, 
    invalidateAndRefetch,
    isLeadsLoading,
    hasMoreLeads,
    loadMoreLeads
  } = usePipelineQueries(selectedPipelineId);

  useEffect(() => {
    invalidateAndRefetch();
  }, []);

  useEffect(() => {
    const handleEditLead = (event: CustomEvent<Lead>) => {
      setEditingLead(event.detail);
    };

    window.addEventListener("editLead", handleEditLead as EventListener);

    return () => {
      window.removeEventListener("editLead", handleEditLead as EventListener);
    };
  }, []);

  const filteredLeads = leads.filter((lead) => {
    if (selectedPipelineId && selectedPipelineId !== "all") {
      if (lead.pipeline_id !== selectedPipelineId) {
        return false;
      }
    }

    if (selectedTagIds.length > 0) {
      // Ensure the lead has a tags property
      const leadTags = lead.tags || [];
      const leadTagIds = leadTags.map(tag => tag.id);
      const hasSelectedTag = selectedTagIds.some(tagId => leadTagIds.includes(tagId));
      if (!hasSelectedTag) {
        return false;
      }
    }

    const query = searchQuery.toLowerCase();
    return (
      (lead.name || "").toLowerCase().includes(query) ||
      (lead.email || "").toLowerCase().includes(query) ||
      (lead.phone || "").toLowerCase().includes(query) ||
      (lead.status || "").toLowerCase().includes(query)
    );
  });

  return (
    <ImportProvider>
      <div className="p-6 space-y-6 flex flex-col h-full">
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
                onSuccess={invalidateAndRefetch}
              />

              <BulkImportDialog
                isOpen={isBulkImportOpen}
                onOpenChange={setIsBulkImportOpen}
                onSuccess={invalidateAndRefetch}
              />
            </div>
          }
        />

        <div className="flex-grow overflow-hidden">
          <LeadsTable
            leads={filteredLeads}
            isLoading={isLeadsLoading}
            onLeadUpdated={invalidateAndRefetch}
            hasMore={hasMoreLeads}
            onLoadMore={loadMoreLeads}
          />
        </div>

        <LeadEditForm
          editingLead={editingLead}
          setEditingLead={setEditingLead}
          pipelines={pipelines}
          onLeadUpdated={invalidateAndRefetch}
        />
        
        <ImportsIndicator />
      </div>
    </ImportProvider>
  );
}
