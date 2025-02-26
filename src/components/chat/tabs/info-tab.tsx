
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

interface InfoTabProps {
  lead: Lead;
}

export function InfoTab({ lead }: InfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState(lead);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      console.log("Saving lead...", editedLead);
      
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
      
      // Invalidate and refetch queries to refresh the data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
        queryClient.invalidateQueries({ queryKey: ['lead_activities', lead.id] })
      ]);

      console.log("Lead updated successfully");
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error("Failed to update lead information");
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
        <h3 className="text-sm font-medium text-muted-foreground">Lead Variables</h3>
        <div className="flex flex-wrap gap-2">
          {lead.variables?.map((variable) => (
            <Badge key={variable.id} variant="secondary">
              <Tag className="w-3 h-3 mr-1" />
              {variable.name}: {variable.value}
            </Badge>
          ))}
          <Button variant="outline" size="sm" className="h-6">
            <PlusCircle className="w-3 h-3 mr-1" />
            Add Variable
          </Button>
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

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Lead Score</h3>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">85/100</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">High Value</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
