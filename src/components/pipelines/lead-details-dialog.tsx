
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/pages/dashboard/leads";
import { format } from "date-fns";
import { PipelineColumn } from "@/types/pipeline";

interface LeadDetailsDialogProps {
  lead: Lead | null;
  onClose: () => void;
  columns: PipelineColumn[];
}

export function LeadDetailsDialog({ lead, onClose, columns }: LeadDetailsDialogProps) {
  if (!lead) return null;

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Lead Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="text-sm space-y-3 bg-muted/50 rounded-lg p-4">
              <p><span className="text-muted-foreground font-medium">Name:</span> {lead.name}</p>
              {lead.email && <p><span className="text-muted-foreground font-medium">Email:</span> {lead.email}</p>}
              {lead.phone && <p><span className="text-muted-foreground font-medium">Phone:</span> {lead.phone}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Status</h3>
            <Badge variant="secondary" className={`${columns.find(s => s.id === lead.status)?.color} text-white px-4 py-1 text-sm`}>
              {lead.status}
            </Badge>
          </div>

          {lead.variables && lead.variables.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Variables</h3>
              <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                {lead.variables.map((variable, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{variable.name}</p>
                    <p className="text-sm">{variable.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Created</h3>
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
              {format(new Date(lead.created_at), 'PPP')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
