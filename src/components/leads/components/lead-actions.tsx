
import { Button } from "@/components/ui/button";
import { Pencil, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LeadVariables } from "../lead-variables";
import { EditLeadForm } from "../edit-lead-form";
import { useState, useEffect } from "react";
import { LeadActionsProps } from "../types/lead-types";
import { supabase } from "@/integrations/supabase/client";

export function LeadActions({ lead, onEditSuccess }: LeadActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [variableCount, setVariableCount] = useState(0);

  // Fetch variable count from database when component mounts
  useEffect(() => {
    const fetchVariableCount = async () => {
      try {
        const { data, error, count } = await supabase
          .from("lead_variables")
          .select("*", { count: 'exact' })
          .eq("lead_id", lead.id);
        
        if (error) throw error;
        setVariableCount(count || 0);
      } catch (error) {
        console.error("Error fetching variables count:", error);
      }
    };

    fetchVariableCount();
  }, [lead.id]);

  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            {variableCount} Variables
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl py-[7px]">Lead Variables</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[80vh]">
            <LeadVariables
              leadId={lead.id}
              variables={lead.variables || []}
              onVariablesUpdated={onEditSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl py-[7px]">Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[80vh]">
            <EditLeadForm
              lead={lead}
              onSuccess={() => {
                setIsEditing(false);
                onEditSuccess();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
