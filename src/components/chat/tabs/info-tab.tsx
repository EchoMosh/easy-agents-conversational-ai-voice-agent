
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Phone, Mail, User, ExternalLink, PenLine, CheckCircle, X } from "lucide-react";
import { LeadVariables } from "@/components/leads/lead-variables";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InfoTabProps {
  pipeline?: Pipeline | null;
  lead?: Lead;
}

export function InfoTab({ pipeline, lead }: InfoTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
  });

  if (!lead) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No lead information available
      </div>
    );
  }

  const statusColors = {
    new: "text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30",
    contacted: "text-purple-500 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-900/30",
    qualified: "text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30",
    converted: "text-green-500 bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/30",
    lost: "text-red-500 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30",
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "text-gray-500 bg-gray-50 border-gray-100";
  };

  const handleEdit = () => {
    setEditableData({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          name: editableData.name,
          email: editableData.email || null,
          phone: editableData.phone || null,
        })
        .eq("id", lead.id);

      if (error) throw error;

      // Invalidate the lead query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ["leads"],
      });

      // Refresh the specific lead
      queryClient.invalidateQueries({
        queryKey: ["lead_activities", lead.id],
      });

      toast.success("Customer information updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update customer information");
    }
  };

  return (
    <div className="space-y-6 px-1 py-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium leading-6">Customer Information</h3>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit} 
              className="h-8 gap-1.5 text-xs"
            >
              <PenLine className="h-3.5 w-3.5" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSave}
                className="h-8 gap-1.5 text-xs bg-green-50 text-green-600 border-green-100 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:border-green-900/30 dark:hover:bg-green-900/30"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Name</Label>
              <Input 
                id="name" 
                value={editableData.name}
                onChange={(e) => setEditableData({...editableData, name: e.target.value})}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
              <Input 
                id="email"
                type="email" 
                value={editableData.email}
                onChange={(e) => setEditableData({...editableData, email: e.target.value})}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</Label>
              <Input 
                id="phone" 
                value={editableData.phone}
                onChange={(e) => setEditableData({...editableData, phone: e.target.value})}
                className="h-9 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 bg-background p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 dark:bg-purple-900/30">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{lead.name}</p>
                <Badge className={cn("mt-1 text-xs font-normal px-2 py-0.5 border", getStatusColor(lead.status))}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 pl-12">
              {lead.email && (
                <div className="flex items-center text-sm gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.email}</span>
                </div>
              )}
              
              {lead.phone && (
                <div className="flex items-center text-sm gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              )}
              
              {!lead.email && !lead.phone && (
                <p className="text-sm text-muted-foreground">No contact information available</p>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Pipeline Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Pipeline</h3>
        {pipeline ? (
          <Button
            variant="outline"
            className="w-full justify-between bg-background border-border/50 hover:bg-muted/50"
            onClick={() => navigate(`/dashboard/pipelines/${pipeline.id}`)}
          >
            {pipeline.name}
            <ExternalLink className="h-4 w-4" />
          </Button>
        ) : (
          <div className="rounded-lg border border-dashed border-border/50 bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">No pipeline information available</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Variables Section */}
      <LeadVariables
        leadId={lead.id}
        variables={lead.variables || []}
        onVariablesUpdated={() => {
          queryClient.invalidateQueries({
            queryKey: ["leads"],
          });
        }}
      />
    </div>
  );
}
