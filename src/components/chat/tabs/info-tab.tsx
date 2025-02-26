import { Tag, Star, PlusCircle, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/pages/dashboard/leads";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InfoTabProps {
  lead: Lead;
}

export function InfoTab({ lead }: InfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState(lead);
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVariable, setNewVariable] = useState({ name: "", value: "" });
  const [editingVariable, setEditingVariable] = useState<{ id: string; name: string; value: string } | null>(null);
  const queryClient = useQueryClient();

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['leads'] }),
      queryClient.invalidateQueries({ queryKey: ['lead_activities', lead.id] })
    ]);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: editedLead.name,
          email: editedLead.email,
          phone: editedLead.phone,
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success("Lead information updated successfully");
      setIsEditing(false);
      await invalidateQueries();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error("Failed to update lead information");
    }
  };

  const handleAddVariable = async () => {
    if (!newVariable.name || !newVariable.value) {
      toast.error("Please fill in both name and value");
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_variables')
        .insert([{
          lead_id: lead.id,
          name: newVariable.name,
          value: newVariable.value
        }]);

      if (error) throw error;

      toast.success("Variable added successfully");
      setIsAddingVariable(false);
      setNewVariable({ name: "", value: "" });
      await invalidateQueries();
    } catch (error) {
      console.error('Error adding variable:', error);
      toast.error("Failed to add variable");
    }
  };

  const handleUpdateVariable = async () => {
    if (!editingVariable) return;

    try {
      const { error } = await supabase
        .from('lead_variables')
        .update({
          name: editingVariable.name,
          value: editingVariable.value
        })
        .eq('id', editingVariable.id);

      if (error) throw error;

      toast.success("Variable updated successfully");
      setEditingVariable(null);
      await invalidateQueries();
    } catch (error) {
      console.error('Error updating variable:', error);
      toast.error("Failed to update variable");
    }
  };

  const handleDeleteVariable = async (variableId: string) => {
    try {
      const { error } = await supabase
        .from('lead_variables')
        .delete()
        .eq('id', variableId);

      if (error) throw error;

      toast.success("Variable deleted successfully");
      await invalidateQueries();
    } catch (error) {
      console.error('Error deleting variable:', error);
      toast.error("Failed to delete variable");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
              >
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedLead(lead);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
        <div className="space-y-3 bg-muted/50 rounded-lg p-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editedLead.name}
                  onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editedLead.email || ''}
                  onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <PhoneInput
                  value={editedLead.phone || ''}
                  onChange={(value) => setEditedLead({ ...editedLead, phone: value })}
                />
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm"><span className="font-medium">Name:</span> {lead.name}</p>
              <p className="text-sm"><span className="font-medium">Email:</span> {lead.email || "Not provided"}</p>
              <p className="text-sm"><span className="font-medium">Phone:</span> {lead.phone || "Not provided"}</p>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Lead Variables</h3>
          <Dialog open={isAddingVariable} onOpenChange={setIsAddingVariable}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Variable
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Variable</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newVariable.name}
                    onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                    placeholder="Enter variable name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    value={newVariable.value}
                    onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                    placeholder="Enter variable value"
                  />
                </div>
              </div>
              <Button onClick={handleAddVariable}>Add Variable</Button>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap gap-2">
          {lead.variables?.map((variable) => (
            editingVariable?.id === variable.id ? (
              <div key={variable.id} className="flex items-center gap-2 bg-white p-2 rounded-md border">
                <Input
                  value={editingVariable.name}
                  onChange={(e) => setEditingVariable({ ...editingVariable, name: e.target.value })}
                  className="h-7 w-32"
                />
                <Input
                  value={editingVariable.value}
                  onChange={(e) => setEditingVariable({ ...editingVariable, value: e.target.value })}
                  className="h-7 w-32"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpdateVariable}
                  className="h-7 w-7 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingVariable(null)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Badge key={variable.id} variant="secondary">
                <Tag className="w-3 h-3 mr-1" />
                {variable.name}: {variable.value}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingVariable(variable)}
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteVariable(variable.id)}
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <Tag className="w-3 h-3 mr-1" />
            New Lead
          </Badge>
          <Badge variant="secondary">
            <Star className="w-3 h-3 mr-1" />
            High Priority
          </Badge>
          <Button variant="outline" size="sm" className="h-6">
            <PlusCircle className="w-3 h-3 mr-1" />
            Add Tag
          </Button>
        </div>
      </div>
    </div>
  );
}
