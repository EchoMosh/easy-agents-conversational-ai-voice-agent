
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lead } from "@/pages/dashboard/leads";

interface LeadEditFormProps {
  editingLead: Lead | null;
  setEditingLead: (lead: Lead | null) => void;
  pipelines: Array<{ id: string; name: string }>;
  onLeadUpdated: () => void;
}

export function LeadEditForm({ 
  editingLead, 
  setEditingLead, 
  pipelines,
  onLeadUpdated 
}: LeadEditFormProps) {
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
        pipeline_id: editPipelineId === "none" ? null : editPipelineId,
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
      onLeadUpdated();
      setEditingLead(null);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
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
              <SelectContent position="popper" className="bg-background z-50">
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
            <Select value={editPipelineId || "none"} onValueChange={setEditPipelineId}>
              <SelectTrigger id="pipeline">
                <SelectValue placeholder="Select a pipeline" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-background z-50">
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
  );
}
