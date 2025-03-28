import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { PipelineSelectorTest } from "./pipeline-selector-test";
import { StatusSelectorTest } from "./status-selector-test";

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
  onLeadUpdated,
}: LeadEditFormProps) {
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPipelineId, setEditPipelineId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [pipelineStages, setPipelineStages] = useState<string[]>([]);
  // Add state for the custom dropdowns
  const [showPipelineDropdown, setShowPipelineDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Set up form when a lead is selected for editing
  useEffect(() => {
    if (editingLead) {
      setEditName(editingLead.name);
      setEditEmail(editingLead.email || "");
      setEditPhone(editingLead.phone || "");
      setEditStatus(editingLead.status || "New");
      setEditPipelineId(editingLead.pipeline_id || "");
      setEmailError("");

      // Load pipeline stages if a pipeline is selected
      if (editingLead.pipeline_id) {
        loadPipelineStages(editingLead.pipeline_id);
      } else {
        setPipelineStages([]);
      }
    }
  }, [editingLead]);

  // Add click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showPipelineDropdown && !target.closest("#pipeline-dropdown")) {
        setShowPipelineDropdown(false);
      }
      if (showStatusDropdown && !target.closest("#status-dropdown")) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPipelineDropdown, showStatusDropdown]);

  // Watch for pipeline changes to update available stages
  useEffect(() => {
    if (editPipelineId && editPipelineId !== "none") {
      loadPipelineStages(editPipelineId);
    } else {
      setPipelineStages([]);
    }
  }, [editPipelineId]);

  // Load stages for a specific pipeline
  const loadPipelineStages = async (pipelineId: string) => {
    try {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .eq("id", pipelineId)
        .single();

      if (error) {
        console.error("Error loading pipeline:", error);
        return;
      }

      const pipeline = convertJsonToPipeline(data);
      const stages = pipeline.columns.map((col) => col.title);
      setPipelineStages(stages);

      // If the current status isn't in the new pipeline's stages, set it to the first stage
      if (stages.length > 0 && !stages.includes(editStatus)) {
        setEditStatus(stages[0]);
      }
    } catch (error) {
      console.error("Error processing pipeline data:", error);
    }
  };

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
        pipeline_id: editingLead.pipeline_id,
      };

      const updatedData = {
        name: editName,
        email: editEmail || null,
        phone: editPhone || null,
        status: editStatus || "New",
        pipeline_id: editPipelineId === "none" ? null : editPipelineId,
        updated_at: new Date().toISOString(),
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
        const oldPipelineName =
          pipelines.find((p) => p.id === originalData.pipeline_id)?.name ||
          "No Pipeline";
        const newPipelineName =
          pipelines.find((p) => p.id === updatedData.pipeline_id)?.name ||
          "No Pipeline";

        // Create activity for pipeline change
        await supabase.from("lead_activities").insert({
          lead_id: editingLead.id,
          content: "Pipeline changed",
          old_value: oldPipelineName,
          new_value: newPipelineName,
          user_id: editingLead.user_id, // Adding the required user_id field
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
    <Sheet
      open={!!editingLead}
      onOpenChange={(open) => !open && setEditingLead(null)}
    >
      <SheetContent className="sm:max-w-md overflow-visible">
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
                  setEmailError(
                    validateEmail(e.target.value)
                      ? ""
                      : "Please enter a valid email address"
                  );
                }
              }}
              onBlur={() => {
                if (editEmail) {
                  setEmailError(
                    validateEmail(editEmail)
                      ? ""
                      : "Please enter a valid email address"
                  );
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
            <PhoneInput id="phone" value={editPhone} onChange={setEditPhone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pipeline">Pipeline</Label>
            <div>
              {/* Using our test component that doesn't rely on portals/popovers */}
              <PipelineSelectorTest
                pipelines={pipelines}
                onSelected={setEditPipelineId}
              />
            </div>
          </div>

          {/* Only show status dropdown if a pipeline is selected */}
          {editPipelineId && editPipelineId !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <div>
                {/* Using our test component that doesn't rely on portals/popovers */}
                <StatusSelectorTest
                  stages={pipelineStages}
                  onSelected={setEditStatus}
                />
              </div>
            </div>
          )}

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
