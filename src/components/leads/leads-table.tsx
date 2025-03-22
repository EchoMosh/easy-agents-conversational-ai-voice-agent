import { useState, useRef, useEffect, useCallback } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/agents/table/delete-dialog";
import { SelectionHeader } from "@/components/agents/table/selection-header";
import { useQuery } from "@tanstack/react-query";
import { LeadTableHeader } from "./components/lead-table-header";
import { LeadRow } from "./components/lead-row";
import { LeadsTableProps, LeadWithHandlers } from "./types/lead-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertCircle, Check } from "lucide-react";
import { NewVariableForm } from "./variables/new-variable-form";
import { EditVariablesDialog } from "./components/edit-variables-dialog";
import { LoadingLeadsTable } from "./components/loading-leads-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function LeadsTable({ leads, isLoading, onLeadUpdated, hasMore, onLoadMore, pageSize = 10 }: LeadsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkVariablesOpen, setIsBulkVariablesOpen] = useState(false);
  const [newVariables, setNewVariables] = useState<{name: string; value: string}[]>([]);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [isEditVariablesOpen, setIsEditVariablesOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [previousLeadsCount, setPreviousLeadsCount] = useState(0);
  const [showNewLeadsIndicator, setShowNewLeadsIndicator] = useState(false);
  const [selectAllMode, setSelectAllMode] = useState<'visible' | 'all'>('visible');
  const [totalFilteredLeadsCount, setTotalFilteredLeadsCount] = useState<number | null>(null);
  const [selectingAllAlert, setSelectingAllAlert] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const tableEndRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: pipelines = [], refetch: refetchPipelines } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (leads.length > previousLeadsCount && previousLeadsCount > 0) {
      setShowNewLeadsIndicator(true);
      setTimeout(() => {
        setShowNewLeadsIndicator(false);
      }, 5000);
    }
    setPreviousLeadsCount(leads.length);
  }, [leads.length, previousLeadsCount]);

  useEffect(() => {
    setSelectAllMode('visible');
    setTotalFilteredLeadsCount(null);
    setSelectedLeads([]);
  }, [leads.length]);

  useEffect(() => {
    if (selectingAllAlert && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectingAllAlert]);

  useEffect(() => {
    const handleScroll = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore && onLoadMore) {
        console.log("✅ Sentinel is visible, loading more leads...");
        setIsLoadingMore(true);
        onLoadMore()
          .then(() => {
            console.log("✅ Successfully loaded more leads");
          })
          .catch((error) => {
            console.error("❌ Error loading more leads:", error);
            toast.error("Failed to load more leads");
          })
          .finally(() => {
            setIsLoadingMore(false);
          });
      }
    };

    const observer = new IntersectionObserver(handleScroll, {
      root: scrollAreaRef.current,
      rootMargin: "200px",
      threshold: 0.1,
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
      console.log("👁️ Observer attached to sentinel element");
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
        console.log("👁️ Observer detached from sentinel element");
      }
    };
  }, [hasMore, isLoadingMore, onLoadMore, leads.length]);

  const handleToggleSelect = (id: string) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = async () => {
    if (selectedLeads.length === leads.length && selectAllMode === 'visible') {
      setSelectedLeads([]);
      return;
    }
    
    if (selectedLeads.length < leads.length) {
      setSelectAllMode('visible');
      setSelectedLeads(leads.map(lead => lead.id));
      return;
    }
    
    if (selectedLeads.length === leads.length && selectAllMode === 'visible' && hasMore) {
      setSelectingAllAlert(true);
      
      setTimeout(() => {
        if (alertRef.current) {
          alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  const handleSelectAllFiltered = async () => {
    const totalFiltered = totalFilteredLeadsCount || leads.length;
    
    const loadingToast = toast.loading(`Selecting all ${totalFiltered} leads...`);
    
    try {
      setSelectAllMode('all');
      setSelectedLeads(leads.map(lead => lead.id));
      toast.success(`Selected all ${totalFiltered} leads`);
    } catch (error) {
      console.error('Error selecting all leads:', error);
      toast.error('Failed to select all leads');
      setSelectAllMode('visible');
    } finally {
      toast.dismiss(loadingToast);
      setSelectingAllAlert(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    if (selectAllMode === 'all' && hasMore) {
      const confirmed = window.confirm(`You are about to delete ALL leads matching your current filter (not just the ${selectedLeads.length} visible ones). This action cannot be undone. Are you sure?`);
      if (!confirmed) {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }
    }
    
    try {
      const relatedTables = [
        'lead_activities',
        'lead_tags',
        'lead_variables'
      ];
      
      for (const table of relatedTables) {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .in('lead_id', selectedLeads);
          
        if (error) {
          console.error(`Error deleting from ${table}:`, error);
          continue;
        }
      }
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedLeads);

      if (error) throw error;

      toast.success(`Successfully deleted ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}`);
      setSelectedLeads([]);
      onLeadUpdated();
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Failed to delete leads');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleMoveToPipeline = async (pipelineId: string) => {
    try {
      const updateData = pipelineId === "none" 
        ? { pipeline_id: null, updated_at: new Date().toISOString() }
        : { pipeline_id: pipelineId, updated_at: new Date().toISOString() };
        
      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .in('id', selectedLeads);

      if (error) throw error;

      const message = pipelineId === "none" 
        ? `Removed ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} from pipeline` 
        : `Moved ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} to pipeline`;
        
      toast.success(message);
      onLeadUpdated();
    } catch (error) {
      console.error('Error moving leads:', error);
      toast.error('Failed to move leads');
    }
  };

  const handleAddVariable = () => {
    setNewVariables([...newVariables, { name: '', value: '' }]);
  };

  const handleRemoveVariable = (index: number) => {
    const updated = [...newVariables];
    updated.splice(index, 1);
    setNewVariables(updated);
  };

  const handleVariableChange = (index: number, field: "name" | "value", value: string) => {
    const updated = [...newVariables];
    updated[index][field] = value;
    setNewVariables(updated);
  };

  const handleBulkAddVariables = async () => {
    if (newVariables.some(v => !v.name.trim())) {
      toast.error("Variable names cannot be empty");
      return;
    }

    try {
      const variablesToAdd = selectedLeads.flatMap(leadId => 
        newVariables.map(v => ({
          lead_id: leadId,
          name: v.name.trim(),
          value: v.value.trim() || null
        }))
      );

      const { error } = await supabase
        .from('lead_variables')
        .insert(variablesToAdd);

      if (error) throw error;

      toast.success(`Added ${newVariables.length} variable${newVariables.length > 1 ? 's' : ''} to ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}`);
      setNewVariables([]);
      setIsBulkVariablesOpen(false);
      onLeadUpdated();
    } catch (error) {
      console.error('Error adding variables:', error);
      toast.error('Failed to add variables');
    }
  };

  const handleOpenVariableEditor = (lead: any) => {
    setEditingLead(lead);
    setIsEditVariablesOpen(true);
  };

  const handleLoadMoreData = async () => {
    if (!onLoadMore || isLoadingMore) return;
    
    console.log("⏳ Loading more leads manually...");
    setIsLoadingMore(true);
    try {
      await onLoadMore();
      console.log("✅ Successfully loaded more leads");
    } catch (error) {
      console.error("❌ Error loading more leads:", error);
      toast.error("Failed to load more leads");
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const handleTotalCount = (event: CustomEvent<number>) => {
      console.log("Total filtered leads count received:", event.detail);
      setTotalFilteredLeadsCount(event.detail);
    };

    window.addEventListener("totalFilteredLeads" as any, handleTotalCount as EventListener);

    return () => {
      window.removeEventListener("totalFilteredLeads" as any, handleTotalCount as EventListener);
    };
  }, []);

  if (isLoading && leads.length === 0) {
    return <LoadingLeadsTable />;
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No leads found. Add your first lead to get started.
      </div>
    );
  }

  const LoadingMoreIndicator = () => {
    return (
      <div ref={loadingRef} className="py-4 flex justify-center items-center space-x-2">
        <LoadingSpinner className="h-5 w-5" />
        <span className="text-sm text-muted-foreground">Loading more leads...</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <SelectionHeader
        selectedCount={selectAllMode === 'all' && totalFilteredLeadsCount ? totalFilteredLeadsCount : selectedLeads.length}
        onDelete={() => setIsDeleteDialogOpen(true)}
        isDeleting={isDeleting}
        onMoveToPipeline={handleMoveToPipeline}
        onAddVariables={() => setIsBulkVariablesOpen(true)}
        pipelines={pipelines}
        selectAllMode={selectAllMode}
      />

      {selectingAllAlert && (
        <div ref={alertRef}>
          <Alert className="mb-4 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="flex flex-1 items-center justify-between text-amber-700 dark:text-amber-400">
              <span>
                {totalFilteredLeadsCount 
                  ? `Select all ${totalFilteredLeadsCount} leads that match your current filter?` 
                  : "Select all leads that match your current filter?"}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectingAllAlert(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="default" onClick={handleSelectAllFiltered}>
                  Select All
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden shadow-sm flex flex-col">
        <div className="w-full">
          <Table>
            <LeadTableHeader
              onToggleSelectAll={handleToggleSelectAll}
              isAllSelected={selectedLeads.length === leads.length || selectAllMode === 'all'}
              isDeleting={isDeleting}
              selectAllMode={selectAllMode}
              visibleCount={leads.length}
              totalCount={totalFilteredLeadsCount}
            />
          </Table>
        </div>
        
        <ScrollArea className="h-[calc(100vh-300px)]" ref={scrollAreaRef}>
          {showNewLeadsIndicator && (
            <div className="sticky top-0 z-10 px-4 py-2">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  New leads loaded successfully
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <Table>
            <TableBody>
              {leads.map((lead) => {
                const pipelineName = lead.pipeline_id ? 
                  pipelines.find(p => p.id === lead.pipeline_id)?.name || 'Unknown' : 
                  'No Pipeline';
                
                const leadWithHandlers: LeadWithHandlers = {
                  ...lead,
                  onVariableClick: handleOpenVariableEditor,
                  onEditClick: (lead) => {
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('editLead', { detail: lead });
                      window.dispatchEvent(event);
                    }
                  }
                };
                  
                return (
                  <LeadRow
                    key={lead.id}
                    lead={leadWithHandlers}
                    isSelected={selectedLeads.includes(lead.id) || (selectAllMode === 'all' && !selectedLeads.includes(lead.id))}
                    onToggleSelect={handleToggleSelect}
                    onLeadUpdated={onLeadUpdated}
                    isDeleting={isDeleting}
                    pipelineName={pipelineName}
                  />
                );
              })}
            </TableBody>
          </Table>
          
          <div 
            ref={sentinelRef} 
            className="h-10 w-full flex items-center justify-center text-muted-foreground text-xs"
            style={{ visibility: hasMore ? 'visible' : 'hidden' }}
          >
            {!isLoadingMore && hasMore && <div className="py-2 text-center">Scroll for more</div>}
          </div>
          
          {isLoadingMore && hasMore && <LoadingMoreIndicator />}
          
          <div ref={tableEndRef} className="h-2" />
        </ScrollArea>
      </div>

      <Dialog open={isBulkVariablesOpen} onOpenChange={setIsBulkVariablesOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Variables to {selectedLeads.length} Lead{selectedLeads.length > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          
          <div className="pt-4 space-y-6">
            <div className="space-y-4">
              {newVariables.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No variables added yet. Click the button below to add a variable.
                </div>
              )}
              
              {newVariables.map((variable, index) => (
                <NewVariableForm
                  key={index}
                  name={variable.name}
                  value={variable.value}
                  onChange={(field, value) => handleVariableChange(index, field, value)}
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
                Save {newVariables.length} Variable{newVariables.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {editingLead && (
        <EditVariablesDialog
          lead={editingLead}
          isOpen={isEditVariablesOpen}
          onOpenChange={setIsEditVariablesOpen}
          onLeadUpdated={onLeadUpdated}
        />
      )}

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title={`Delete ${selectAllMode === 'all' && totalFilteredLeadsCount ? totalFilteredLeadsCount : selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}?`}
        description={selectAllMode === 'all' 
          ? "This action cannot be undone. This will permanently delete ALL leads matching your current filter, not just the ones you can see."
          : "This action cannot be undone. This will permanently delete the selected leads and remove their data from our servers."}
      />
    </div>
  );
}
