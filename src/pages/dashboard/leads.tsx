
import { useState, useEffect } from "react";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePipelineQueries } from "@/hooks/pipeline/use-pipeline-queries";

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
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>();
  const { pipelines, leads, invalidateAndRefetch } = usePipelineQueries(selectedPipelineId);

  useEffect(() => {
    if (pipelines?.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId]);

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

      {leads.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No leads found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsNewLeadOpen(true)}
          >
            Add your first lead
          </Button>
        </div>
      )}

      {leads.length > 0 && (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="p-4 border rounded-lg">
              <h3 className="font-medium">{lead.name}</h3>
              {lead.email && <p className="text-sm text-muted-foreground">{lead.email}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
