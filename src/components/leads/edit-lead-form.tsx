import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query"; // Added
import { Plus, X as CloseIconLucide, Loader2 } from "lucide-react"; // Added X and Loader2
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { Lead } from "@/pages/dashboard/leads";
import { LeadVariables } from "./lead-variables";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditLeadFormProps {
  lead: Lead;
  onSuccess: () => void;
}

export function EditLeadForm({ lead, onSuccess }: EditLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email || "");
  const [phone, setPhone] = useState(lead.phone || "");
  const [status, setStatus] = useState(lead.status);

  // State for adding new variables
  const [newVariableName, setNewVariableName] = useState("");
  const [newVariableValue, setNewVariableValue] = useState("");
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const queryClient = useQueryClient(); // Added

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          name,
          email: email || null,
          phone: phone || null,
          status,
        })
        .eq("id", lead.id);

      if (updateError) throw updateError;

      toast.success("Lead updated successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to update lead");
      console.error("Error updating lead:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const parts = name.split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

  const handleAddNewVariable = async () => {
    if (!newVariableName.trim()) {
      toast.error("Variable name cannot be empty.");
      return;
    }
    setIsAddingVariable(true);
    try {
      const { data: newVar, error } = await supabase
        .from("lead_variables")
        .insert({
          lead_id: lead.id,
          name: newVariableName.trim(),
          value: newVariableValue.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Variable "${newVar.name}" added`);
      setNewVariableName("");
      setNewVariableValue("");
      queryClient.invalidateQueries({ queryKey: ["leadVariables"] });
      onSuccess(); // To refresh the variables list in the parent/dialog
    } catch (error) {
      console.error("Error adding variable:", error);
      toast.error("Failed to add variable.");
    } finally {
      setIsAddingVariable(false);
    }
  };

  const handleDeleteVariable = async (variableId: string) => {
    // Add a confirmation dialog here in a real app
    try {
      const { error } = await supabase
        .from("lead_variables")
        .delete()
        .eq("id", variableId);

      if (error) throw error;

      toast.success("Variable deleted");
      queryClient.invalidateQueries({ queryKey: ["leadVariables"] });
      onSuccess(); // To refresh the variables list
    } catch (error) {
      console.error("Error deleting variable:", error);
      toast.error("Failed to delete variable.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {/* Contact Information Section */}
        <div>
          <Label className="text-xl font-semibold mb-6 block">
            Contact Information
          </Label>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-muted-foreground"
                >
                  First name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setName(`${e.target.value} ${lastName}`)}
                  required
                  className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Last name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setName(`${firstName} ${e.target.value}`)}
                  required
                  className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Phone
                </Label>
                <PhoneInput
                  id="phone"
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  className="[&>div]:!h-11 [&>div]:!text-base [&>div]:!border-border/50 [&>div]:!bg-background/50 [&>div]:hover:!bg-background/80 [&>div]:!transition-colors [&>div>div]:!border-border/50 [&>div>div]:!bg-background/50 [&>div>div]:hover:!bg-background/80"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="status"
                className="text-sm font-medium text-muted-foreground"
              >
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(value: Lead["status"]) => setStatus(value)}
              >
                <SelectTrigger className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Custom Variables Section */}
        <div>
          <Label className="text-xl font-semibold mb-4 block">
            Custom Variables
          </Label>

          {/* Add New Variable Form */}
          <div className="mb-6 p-4 border border-border/50 rounded-lg bg-background/30">
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Add New Variable
            </Label>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Variable name (e.g., Fav_Car)"
                value={newVariableName}
                onChange={(e) => setNewVariableName(e.target.value)}
                className="h-10 text-sm flex-1"
              />
              <Input
                placeholder="Value (e.g., Honda Civic)"
                value={newVariableValue}
                onChange={(e) => setNewVariableValue(e.target.value)}
                className="h-10 text-sm flex-1"
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 bg-primary/90 hover:bg-primary"
                onClick={handleAddNewVariable}
                disabled={isAddingVariable || !newVariableName.trim()}
              >
                {isAddingVariable ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          <LeadVariables
            leadId={lead.id}
            variables={lead.variables || []} // This should be dynamically updated
            onVariablesUpdated={onSuccess} // This will be called by LeadVariables on edit, and by this form on add/delete
            // onAddClick prop is no longer needed here as add is handled in this form
            onDelete={handleDeleteVariable} // Pass the delete handler
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 text-base bg-primary/90 hover:bg-primary transition-all duration-200"
      >
        {isLoading ? "Updating..." : "Update Lead"}
      </Button>
    </form>
  );
}
