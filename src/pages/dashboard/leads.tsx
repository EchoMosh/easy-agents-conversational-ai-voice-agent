
import { useState, useEffect } from "react";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePipelineQueries } from "@/hooks/pipeline/use-pipeline-queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";

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
  source?: string; // Added the source property as optional
  variables?: LeadVariable[];
  tags?: any[];
}

export default function LeadsPage() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const { pipelines, leads, invalidateAndRefetch } = usePipelineQueries(selectedPipelineId);

  // For editing a lead
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPipelineId, setEditPipelineId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Load all leads on first render
  useEffect(() => {
    // Force a refetch of all leads when the component mounts
    invalidateAndRefetch();
  }, []);

  // Set up form when a lead is selected for editing
  useEffect(() => {
    if (editingLead) {
      setEditName(editingLead.name);
      setEditEmail(editingLead.email || "");
      setEditPhone(editingLead.phone || "");
      setEditStatus(editingLead.status || "New");
      setEditPipelineId(editingLead.pipeline_id || "");
      setEmailError("");
    }
  }, [editingLead]);

  // Validate email
  const validateEmail = (email: string) => {
    if (!email) return true; // Empty email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle lead update
  const handleUpdateLead = async () => {
    if (!editingLead) return;
    
    // Validate email
    if (editEmail && !validateEmail(editEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    setIsUpdating(true);
    try {
      // Store original values for activity tracking
      const originalData = {
        name: editingLead.name,
        email: editingLead.email,
        phone: editingLead.phone,
        status: editingLead.status,
        pipeline_id: editingLead.pipeline_id
      };
      
      const updatedData = {
        name: editName,
        email: editEmail || null,
        phone: editPhone || null,
        status: editStatus || "New",
        pipeline_id: editPipelineId || null,
        updated_at: new Date().toISOString()
      };
      
      // Update the lead
      const { error } = await supabase
        .from("leads")
        .update(updatedData)
        .eq("id", editingLead.id);

      if (error) throw error;
      
      // The triggers in Supabase will handle tracking activities for most fields
      // But we need to manually track pipeline change since it's not covered by triggers
      if (originalData.pipeline_id !== updatedData.pipeline_id) {
        // Get old and new pipeline names
        const oldPipelineName = pipelines.find(p => p.id === originalData.pipeline_id)?.name || 'No Pipeline';
        const newPipelineName = pipelines.find(p => p.id === updatedData.pipeline_id)?.name || 'No Pipeline';
        
        // Create activity for pipeline change
        await supabase
          .from("lead_activities")
          .insert({
            lead_id: editingLead.id,
            content: 'Pipeline changed',
            old_value: oldPipelineName,
            new_value: newPipelineName,
            user_id: editingLead.user_id // Adding the required user_id field
          });
      }
      
      toast.success("Lead updated successfully");
      invalidateAndRefetch();
      setEditingLead(null);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter leads based on search query
  const filteredLeads = leads.filter(lead => {
    const query = searchQuery.toLowerCase();
    return (
      (lead.name || '').toLowerCase().includes(query) ||
      (lead.email || '').toLowerCase().includes(query) ||
      (lead.phone || '').toLowerCase().includes(query) ||
      (lead.status || '').toLowerCase().includes(query)
    );
  });

  // Log counts for debugging
  console.log(`Total leads: ${leads.length}, Filtered leads: ${filteredLeads.length}`);
  // Log unique lead names to debug duplicate issues
  const uniqueNames = new Set(leads.map(lead => lead.name));
  console.log(`Unique lead names: ${uniqueNames.size}, Names: ${Array.from(uniqueNames).join(', ')}`);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
          <Button onClick={() => setIsNewLeadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Add New Lead</DialogTitle>
            </DialogHeader>
            <NewLeadForm onSuccess={() => {
              setIsNewLeadOpen(false);
              invalidateAndRefetch();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-6" />

      {/* Pipeline filter select */}
      <div className="flex gap-4 mb-4">
        <div className="w-64">
          <Label htmlFor="pipelineFilter">Filter by Pipeline</Label>
          <Select 
            value={selectedPipelineId || ''} 
            onValueChange={(value) => setSelectedPipelineId(value === '' ? undefined : value)}
          >
            <SelectTrigger id="pipelineFilter">
              <SelectValue placeholder="All Pipelines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pipelines</SelectItem>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Search bar */}
        <div className="flex-1">
          <Label htmlFor="searchLeads">Search Leads</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="searchLeads"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-10">
          {searchQuery || selectedPipelineId ? (
            <p className="text-muted-foreground">No leads matching your search criteria.</p>
          ) : (
            <>
              <p className="text-muted-foreground">No leads found.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsNewLeadOpen(true)}
              >
                Add your first lead
              </Button>
            </>
          )}
        </div>
      )}

      {filteredLeads.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const pipelineName = lead.pipeline_id ? 
                  pipelines.find(p => p.id === lead.pipeline_id)?.name || 'Unknown' : 
                  'No Pipeline';
                  
                const createdAt = new Date(lead.created_at).toLocaleDateString();
                
                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name || 'Unnamed Lead'}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>
                      {lead.status ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                          {lead.status}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{pipelineName}</TableCell>
                    <TableCell>{createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingLead(lead)}
                      >
                        <span className="sr-only">Edit</span>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Lead Slide-in Panel */}
      <Sheet open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Lead</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Lead name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email" 
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  if (emailError) {
                    setEmailError(validateEmail(e.target.value) ? "" : "Please enter a valid email address");
                  }
                }}
                onBlur={() => {
                  if (editEmail) {
                    setEmailError(validateEmail(editEmail) ? "" : "Please enter a valid email address");
                  } else {
                    setEmailError("");
                  }
                }}
                placeholder="Email address"
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && <p className="text-sm text-red-500">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <PhoneInput
                id="phone"
                value={editPhone}
                onChange={setEditPhone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editStatus || "New"} onValueChange={setEditStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Won">Won</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="New Stage">New Stage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pipeline">Pipeline</Label>
              <Select value={editPipelineId || ""} onValueChange={setEditPipelineId}>
                <SelectTrigger id="pipeline">
                  <SelectValue placeholder="Select a pipeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Pipeline</SelectItem>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4">
              <Button 
                className="w-full"
                onClick={handleUpdateLead}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Lead"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
