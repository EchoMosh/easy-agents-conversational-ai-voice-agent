
import { Mail, Phone, User, Tag, PlusCircle, Pencil, Check, X } from "lucide-react";
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
import { TagsManager } from "@/components/leads/components/tags/tags-manager";
import { PipelineSelect } from "@/components/leads/components/pipeline-select";
import { useQuery } from "@tanstack/react-query";

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

  // Fetch pipelines
  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['leads'] }),
      queryClient.invalidateQueries({ queryKey: ['lead_activities', lead.id] })
    ]);
  };

  const handlePipelineChange = async (pipelineId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ pipeline_id: pipelineId })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success("Pipeline updated successfully");
      await invalidateQueries();
    } catch (error: any) {
      console.error('Error updating pipeline:', error);
      toast.error(error.message || "Failed to update pipeline");
    }
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
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast.error(error.message || "Failed to update lead information");
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
    } catch (error: any) {
      console.error('Error adding variable:', error);
      toast.error(error.message || "Failed to add variable");
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
    } catch (error: any) {
      console.error('Error updating variable:', error);
      toast.error(error.message || "Failed to update variable");
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
    } catch (error: any) {
      console.error('Error deleting variable:', error);
      toast.error(error.message || "Failed to delete variable");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                className="h-9 px-4 rounded-lg"
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
                className="h-9 px-4 rounded-lg"
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
              className="h-9 px-4 rounded-lg hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl p-6 space-y-6 border border-gray-100">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    value={editedLead.name}
                    onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
                    placeholder="Enter name"
                    className="pl-10 h-10 text-base bg-white border-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    value={editedLead.email || ''}
                    onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                    placeholder="Enter email"
                    className="pl-10 h-10 text-base bg-white border-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Phone</Label>
                <PhoneInput
                  value={editedLead.phone || ''}
                  onChange={(value) => setEditedLead({ ...editedLead, phone: value })}
                  className="[&>div]:!h-10 [&>div]:!text-base [&>div]:!border-gray-200 [&>div]:!bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-base text-gray-900">{lead.name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-base text-gray-600">{lead.email || "Not provided"}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-base text-gray-600">{lead.phone || "Not provided"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Pipeline</h3>
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <PipelineSelect
            pipelines={pipelines}
            selectedPipelineId={lead.pipeline_id}
            onPipelineChange={handlePipelineChange}
          />
        </div>
      </div>

      {/* Tags Section */}
      <div className="space-y-4">
        <TagsManager leadId={lead.id} tags={lead.tags || []} />
      </div>

      {/* Variables Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Lead Variables</h3>
          <Dialog open={isAddingVariable} onOpenChange={setIsAddingVariable}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg border-gray-200">
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
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                  <Input
                    id="name"
                    value={newVariable.name}
                    onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                    placeholder="Enter variable name"
                    className="h-10 text-base bg-white border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-sm font-medium text-gray-700">Value</Label>
                  <Input
                    id="value"
                    value={newVariable.value}
                    onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                    placeholder="Enter variable value"
                    className="h-10 text-base bg-white border-gray-200"
                  />
                </div>
              </div>
              <Button onClick={handleAddVariable} className="w-full h-10 text-base">Add Variable</Button>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap gap-2">
          {lead.variables?.map((variable) => (
            editingVariable?.id === variable.id ? (
              <div key={variable.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                <Input
                  value={editingVariable.name}
                  onChange={(e) => setEditingVariable({ ...editingVariable, name: e.target.value })}
                  className="h-8 w-32 text-sm bg-white border-gray-200"
                />
                <Input
                  value={editingVariable.value}
                  onChange={(e) => setEditingVariable({ ...editingVariable, value: e.target.value })}
                  className="h-8 w-32 text-sm bg-white border-gray-200"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpdateVariable}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingVariable(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Badge key={variable.id} variant="secondary" className="py-1.5 px-3 text-sm bg-gray-100 hover:bg-gray-200 border-0">
                <Tag className="w-3.5 h-3.5 mr-2 text-gray-500" />
                {variable.name}: {variable.value}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingVariable(variable)}
                  className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
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
    </div>
  );
}
