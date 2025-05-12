import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  bulkDeleteLeads,
  bulkUpdateLeads,
  bulkAddVariables,
} from "@/utils/supabase-bulk-operations";
import { useWorkspace } from "@/context/workspace-context";
import { DeleteDialog } from "@/components/agents/table/delete-dialog";
import { SelectionHeader } from "@/components/agents/table/selection-header";
import { LeadsTableProps } from "./types/lead-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronDown, AlertCircle, Check } from "lucide-react";
import { NewVariableForm } from "./variables/new-variable-form";
import { EditVariablesDialog } from "./components/edit-variables-dialog";
import { LoadingLeadsTable } from "./components/loading-leads-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LeadSkeletonRows } from "./components/lead-skeleton-row";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadRow } from "./components/lead-row";
import { LeadTableHeader } from "./components/lead-table-header";

export function LeadsTable({
  leads,
  isLoading,
  isFetching,
  onLeadUpdated,
  hasMore,
  onLoadMore,
  pageSize,
  totalCount,
  pipelines = [],
}: LeadsTableProps) {
  // ===== ALL HOOKS MUST BE DECLARED FIRST =====
  // State hooks
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkVariablesOpen, setIsBulkVariablesOpen] = useState(false);
  const [newVariables, setNewVariables] = useState<
    { name: string; value: string }[]
  >([]);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [isEditVariablesOpen, setIsEditVariablesOpen] = useState(false);
  const [selectAllMode, setSelectAllMode] = useState<"visible" | "all">(
    "visible"
  );
  const [selectAllPromptOpen, setSelectAllPromptOpen] = useState(false);

  // Refs must be declared before conditions
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Contexts
  const { currentWorkspace } = useWorkspace();

  // ===== HANDLERS =====
  // Handle selection
  const handleToggleSelect = (id: string) => {
    if (selectAllMode === "all") {
      // In "select all" mode, we need to switch back to "visible" mode
      setSelectAllMode("visible");
    }

    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((leadId) => leadId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    // Simple toggle behavior for the checkbox - just select/deselect visible leads
    if (selectedLeads.length === leads.length && leads.length > 0) {
      // If everything visible is selected, deselect all
      setSelectedLeads([]);
      setSelectAllMode("visible");
    } else {
      // Otherwise select all visible
      setSelectedLeads(leads.map((lead) => lead.id));
      setSelectAllMode("visible");
    }
  };

  // Handle selecting all matching leads, not just visible ones
  const handleSelectAllMatchingLeads = () => {
    setSelectAllMode("all");
    // We keep the selectedLeads array as is - it will hold the IDs of visible leads
    // But operations will know to apply to all matching leads, not just these
    setSelectAllPromptOpen(false);
    toast.success(`Selected all ${totalCount || "matching"} leads`);
  };

  // Pipeline helpers
  const getPipelineName = (pipelineId: string) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    return pipeline?.name || "Unknown";
  };

  // Function to scroll to the bottom of the leads table after loading more
  const handleLoadMore = async () => {
    if (onLoadMore) {
      await onLoadMore();

      // After new content is loaded, scroll to show new content
      setTimeout(() => {
        if (scrollContainerRef.current) {
          // Scroll down by 200px to show the newly loaded content
          scrollContainerRef.current.scrollTop += 200;
        }
      }, 100);
    }
  };

  // Get filter object for "all" operations
  const getAllLeadsFilter = () => {
    return {
      workspaceId: currentWorkspace?.id,
      // Include any filters the user has applied
      // For a real implementation, these would come from URL params or state
    };
  };

  // Handle deletion
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      let result;

      if (selectAllMode === "all") {
        // Delete all matching leads using filter
        result = await bulkDeleteLeads(null, getAllLeadsFilter());
      } else {
        // Delete selected leads using IDs
        result = await bulkDeleteLeads(selectedLeads);
      }

      toast.success(
        `Successfully deleted ${result.count} lead${
          result.count !== 1 ? "s" : ""
        }`
      );
      setSelectedLeads([]);
      setSelectAllMode("visible");
      onLeadUpdated();
    } catch (error) {
      console.error("Error deleting leads:", error);
      toast.error("Failed to delete leads");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle move to pipeline
  const handleMoveToPipeline = async (pipelineId: string) => {
    try {
      const updateData = {
        pipeline_id: pipelineId === "none" ? null : pipelineId,
      };

      let result;

      if (selectAllMode === "all") {
        // Update all matching leads using filter
        result = await bulkUpdateLeads(updateData, null, getAllLeadsFilter());
      } else {
        // Update selected leads using IDs
        result = await bulkUpdateLeads(updateData, selectedLeads);
      }

      const message =
        pipelineId === "none"
          ? `Removed ${result.count} lead${
              result.count !== 1 ? "s" : ""
            } from pipeline`
          : `Moved ${result.count} lead${
              result.count !== 1 ? "s" : ""
            } to pipeline`;

      toast.success(message);
      onLeadUpdated();
    } catch (error) {
      console.error("Error moving leads:", error);
      toast.error("Failed to move leads");
    }
  };

  // Variables management
  const handleAddVariable = () => {
    setNewVariables([...newVariables, { name: "", value: "" }]);
  };

  const handleRemoveVariable = (index: number) => {
    const updated = [...newVariables];
    updated.splice(index, 1);
    setNewVariables(updated);
  };

  const handleVariableChange = (
    index: number,
    field: "name" | "value",
    value: string
  ) => {
    const updated = [...newVariables];
    updated[index][field] = value;
    setNewVariables(updated);
  };

  const handleBulkAddVariables = async () => {
    if (newVariables.some((v) => !v.name.trim())) {
      toast.error("Variable names cannot be empty");
      return;
    }

    try {
      const variables = newVariables.map((v) => ({
        name: v.name.trim(),
        value: v.value.trim() || null,
      }));

      let result;

      if (selectAllMode === "all") {
        // Add variables to all matching leads using filter
        result = await bulkAddVariables(variables, null, getAllLeadsFilter());
      } else {
        // Add variables to selected leads using IDs
        result = await bulkAddVariables(variables, selectedLeads);
      }

      const leadCount =
        selectAllMode === "all"
          ? totalCount || "all matching"
          : selectedLeads.length;

      toast.success(
        `Added ${variables.length} variable${
          variables.length > 1 ? "s" : ""
        } to ${leadCount} lead${leadCount !== 1 ? "s" : ""}`
      );
      setNewVariables([]);
      setIsBulkVariablesOpen(false);
      onLeadUpdated();
    } catch (error) {
      console.error("Error adding variables:", error);
      toast.error("Failed to add variables");
    }
  };

  const handleOpenVariableEditor = (lead: any) => {
    setEditingLead(lead);
    setIsEditVariablesOpen(true);
  };

  // ===== CONDITIONAL RENDERING =====
  // Enhanced loading state with smoother transitions
  const [showLoading, setShowLoading] = useState(isLoading);

  // Use an effect to debounce loading state changes
  useEffect(() => {
    let timer: NodeJS.Timeout;

    // If loading is starting, show loading immediately
    if (isLoading) {
      setShowLoading(true);
    }
    // If loading is ending, delay removing the loading state to prevent flicker
    else if (!isLoading && showLoading) {
      timer = setTimeout(() => {
        setShowLoading(false);
      }, 500); // Keep loading state for a bit to prevent flicker
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, showLoading]);

  // Loading state with improved transitions
  if (showLoading && leads.length === 0) {
    return <LoadingLeadsTable />;
  }

  // Empty state with better handling
  if (leads.length === 0 && !showLoading) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No leads found. Add your first lead to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg w-full flex flex-col h-full relative">
      {selectedLeads.length > 0 && (
        <div className="sticky top-0 z-[25] bg-background pb-2 px-4 pt-2 border-b shadow-sm">
          <SelectionHeader
            selectedCount={
              selectAllMode === "all"
                ? totalCount || leads.length
                : selectedLeads.length
            }
            onDelete={() => setIsDeleteDialogOpen(true)}
            isDeleting={isDeleting}
            onMoveToPipeline={handleMoveToPipeline}
            onAddVariables={() => setIsBulkVariablesOpen(true)}
            pipelines={pipelines}
            selectAllMode={selectAllMode}
          />
        </div>
      )}

      {/* Select All Prompt */}
      {selectAllPromptOpen && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-3 bg-amber-50 border border-amber-300 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-amber-900 font-medium">
                Select all {totalCount} matching leads?
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectAllPromptOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSelectAllMatchingLeads}
              >
                Select All {totalCount} Leads
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table with proper header stickiness */}
      <div className="w-full">
        <div ref={scrollContainerRef}>
          <Table className="w-full border">
            {/* Sticky header */}
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              <LeadTableHeader
                onToggleSelectAll={handleToggleSelectAll}
                isAllSelected={
                  selectedLeads.length === leads.length && leads.length > 0
                }
                isDeleting={isDeleting}
                selectAllMode={selectAllMode}
                visibleCount={leads.length}
                totalCount={totalCount}
                onSelectAllMatching={
                  hasMore ? handleSelectAllMatchingLeads : undefined
                }
              />
            </TableHeader>

            <TableBody>
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  isSelected={selectedLeads.includes(lead.id)}
                  onToggleSelect={handleToggleSelect}
                  onLeadUpdated={onLeadUpdated}
                  isDeleting={isDeleting}
                  pipelineName={getPipelineName(lead.pipeline_id)}
                />
              ))}

              {/* Show skeleton loading rows when fetching more data */}
              {isFetching && <LeadSkeletonRows count={4} />}
            </TableBody>
          </Table>
        </div>

        {/* Loading trigger - appears when user approaches bottom */}
        {hasMore && !isFetching && (
          <div
            className="text-center py-6 border-t bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
            onClick={handleLoadMore}
          >
            <span className="text-sm flex items-center justify-center gap-2 text-primary">
              <ChevronDown className="h-4 w-4" />
              Load more leads
            </span>
          </div>
        )}

        {/* Footer with count info and loading indicator */}
        <div className="border-t bg-background py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {leads.length} {totalCount ? `of ${totalCount}` : ""}{" "}
              leads
            </div>

            {isFetching ? (
              <div className="flex items-center text-primary animate-pulse">
                <LoadingSpinner className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">
                  Loading more leads...
                </span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                {hasMore
                  ? "Scroll down or click 'Load more' to see more leads"
                  : `All ${leads.length} leads loaded`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Variables Dialog */}
      <Dialog open={isBulkVariablesOpen} onOpenChange={setIsBulkVariablesOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Add Variables to {selectedLeads.length} Lead
              {selectedLeads.length > 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="pt-4 space-y-6">
            <div className="space-y-4">
              {newVariables.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No variables added yet. Click the button below to add a
                  variable.
                </div>
              )}

              {newVariables.map((variable, index) => (
                <NewVariableForm
                  key={index}
                  name={variable.name}
                  value={variable.value}
                  onChange={(field, value) =>
                    handleVariableChange(index, field, value)
                  }
                  onRemove={() => handleRemoveVariable(index)}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddVariable}
              className="w-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Variable
            </Button>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setNewVariables([]);
                  setIsBulkVariablesOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAddVariables}
                disabled={newVariables.length === 0}
              >
                Save {newVariables.length} Variable
                {newVariables.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Variables Dialog */}
      {editingLead && (
        <EditVariablesDialog
          lead={editingLead}
          isOpen={isEditVariablesOpen}
          onOpenChange={setIsEditVariablesOpen}
          onLeadUpdated={onLeadUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title={`Delete ${
          selectAllMode === "all"
            ? totalCount || "all matching"
            : selectedLeads.length
        } lead${
          (selectAllMode === "all" ? totalCount : selectedLeads.length) !== 1
            ? "s"
            : ""
        }?`}
        description={
          selectAllMode === "all"
            ? "This action cannot be undone. This will permanently delete ALL leads matching your current filters."
            : "This action cannot be undone. This will permanently delete the selected leads and remove their data from our servers."
        }
      />
    </div>
  );
}
