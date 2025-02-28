
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

  // Set up form when a lead is selected for editing
  useEffect(() => {
    if (editingLead) {
      setEditName(editingLead.name);
      setEditEmail(editingLead.email || "");
      setEditPhone(editingLead.phone || "");
      setEditStatus(editingLead.status);
      setEditPipelineId(editingLead.pipeline_id);
      setEmailError("");
    }
  }, [editingLead]);

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle lead update
  const handleUpdateLead = async () => {
    if (!editingLead) return;
    
    // Validate email
    if (!validateEmail(editEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          name: editName,
          email: editEmail || null,
          phone: editPhone || null,
          status: editStatus,
          pipeline_id: editPipelineId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingLead.id);

      if (error) throw error;
      
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
      lead.name.toLowerCase().includes(query) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.phone && lead.phone.toLowerCase().includes(query)) ||
      lead.status.toLowerCase().includes(query)
    );
  });

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

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-10">
          {searchQuery ? (
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
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                        {lead.status}
                      </span>
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
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
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
                  setEmailError(validateEmail(editEmail) ? "" : "Please enter a valid email address");
                }}
                placeholder="Email address"
                required
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && <p className="text-sm text-red-500">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pipeline">Pipeline</Label>
              <Select value={editPipelineId} onValueChange={setEditPipelineId}>
                <SelectTrigger id="pipeline">
                  <SelectValue placeholder="Select a pipeline" />
                </SelectTrigger>
                <SelectContent>
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
