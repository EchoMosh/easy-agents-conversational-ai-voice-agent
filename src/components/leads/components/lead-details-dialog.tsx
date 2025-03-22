
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagBadge } from "./tags/tag-badge";

interface LeadDetailsDialogProps {
  lead: Lead | null;
  onClose: () => void;
  columns?: PipelineColumn[];
}

export function LeadDetailsDialog({ lead, onClose, columns = [] }: LeadDetailsDialogProps) {
  if (!lead) return null;
  
  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="flex items-center justify-between p-6 pb-2">
          <DialogTitle className="text-xl font-semibold text-gray-800">Lead Details: {lead.name}</DialogTitle>
          <button 
            onClick={onClose} 
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="space-y-4 p-6 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {lead.email || "Not provided"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span> {lead.phone || "Not provided"}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status Information</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span> {lead.status || "None"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Created:</span> {new Date(lead.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            {lead.variables && lead.variables.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Variables</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {lead.variables.map((variable) => (
                    <div key={variable.id} className="border rounded p-2 text-sm">
                      <span className="font-medium">{variable.name}:</span> {variable.value || "Not set"}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {lead.tags && lead.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lead.tags.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      tag={{
                        id: tag.id,
                        name: tag.name,
                        color: tag.color as any,
                        user_id: '' // Providing a default empty string to satisfy the type
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
