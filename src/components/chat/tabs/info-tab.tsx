
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
import { Card, CardContent } from "@/components/ui/card";
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
  console.log("InfoTab render - lead:", lead);
  console.log("InfoTab render - pipeline:", pipeline);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
  });

  if (!lead) {
    console.log("InfoTab - No lead information available");
    return (
      <div className="p-6 text-center text-muted-foreground">
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
    console.log("Getting status color for:", status);
    return statusColors[status as keyof typeof statusColors] || "text-gray-500 bg-gray-50 border-gray-100";
  };

  const handleEdit = () => {
    console.log("Edit button clicked");
    setEditableData({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    console.log("Cancel edit clicked");
    setIsEditing(false);
  };

  const handleSave = async () => {
    console.log("Save clicked with data:", editableData);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          name: editableData.name,
          email: editableData.email || null,
          phone: editableData.phone || null,
        })
        .eq("id", lead.id);

      if (error) {
        console.error("Supabase error updating lead:", error);
        throw error;
      }

      // Invalidate the lead query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ["leads"],
      });

      // Refresh the specific lead
      queryClient.invalidateQueries({
        queryKey: ["lead_activities", lead.id],
      });

      console.log("Lead updated successfully");
      toast.success("Customer information updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update customer information");
    }
  };

  console.log("Rendering info tab content for lead:", lead.name);
  console.log("Lead status:", lead.status);
  console.log("Lead variables:", lead.variables);

  return (
    <div className="space-y-8 px-5 py-6">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-medium leading-6">Customer Information</h3>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit} 
              className="h-9 gap-1.5 text-xs"
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
                className="h-9 w-9 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSave}
                className="h-9 gap-1.5 text-xs bg-green-50 text-green-600 border-green-100 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:border-green-900/30 dark:hover:bg-green-900/30"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <Card className="border border-border/70 shadow-sm">
            <CardContent className="space-y-5 p-5">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Name</Label>
                <Input 
                  id="name" 
                  value={editableData.name}
                  onChange={(e) => setEditableData({...editableData, name: e.target.value})}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  value={editableData.email}
                  onChange={(e) => setEditableData({...editableData, email: e.target.value})}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</Label>
                <Input 
                  id="phone" 
                  value={editableData.phone}
                  onChange={(e) => setEditableData({...editableData, phone: e.target.value})}
                  className="h-10 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-5 space-y-5 border border-border/70 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 dark:bg-purple-900/30">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-medium">{lead.name}</p>
                {lead.status && (
                  <Badge className={cn("mt-2 text-xs font-normal px-2.5 py-0.5 border", getStatusColor(lead.status))}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-4 pl-16">
              {lead.email && (
                <div className="flex items-center text-sm gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="text-base">{lead.email}</span>
                </div>
              )}
              
              {lead.phone && (
                <div className="flex items-center text-sm gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span className="text-base">{lead.phone}</span>
                </div>
              )}
              
              {!lead.email && !lead.phone && (
                <p className="text-sm text-muted-foreground">No contact information available</p>
              )}
            </div>
          </Card>
        )}
      </div>

      <Separator className="my-6" />

      {/* Pipeline Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium mb-4">Pipeline</h3>
        {pipeline ? (
          <Card className="border border-border/70 shadow-sm">
            <Button
              variant="ghost"
              className="w-full justify-between p-5 text-left h-auto"
              onClick={() => navigate(`/dashboard/pipelines/${pipeline.id}`)}
            >
              <span className="font-medium">{pipeline.name}</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Card>
        ) : (
          <Card className="border border-dashed border-border/50 bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">No pipeline information available</p>
          </Card>
        )}
      </div>

      <Separator className="my-6" />

      {/* Variables Section */}
      <Card className="border border-border/70 shadow-sm p-5">
        <LeadVariables
          leadId={lead.id}
          variables={lead.variables || []}
          onVariablesUpdated={() => {
            console.log("Variables updated, invalidating queries");
            queryClient.invalidateQueries({
              queryKey: ["leads"],
            });
          }}
        />
      </Card>
    </div>
  );
}
