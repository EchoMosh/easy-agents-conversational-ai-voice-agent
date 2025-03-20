
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Lead } from "@/pages/dashboard/leads";
import { cn } from "@/lib/utils";
import { Mail, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LibraryLeadCardProps {
  lead: Lead;
  pipelineId?: string;
  onImport: (lead: Lead, pipelineId: string, status: string) => void;
}

export function LibraryLeadCard({ lead, pipelineId, onImport }: LibraryLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${lead.id}`,
    data: {
      type: "LibraryLead",
      lead,
      fromLibrary: true
    }
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition: 'transform 0ms',
        zIndex: 50,
      }
    : undefined;
  
  // Get name from first_name and last_name, or fallback to "name" property
  const displayName = lead.first_name && lead.last_name 
    ? `${lead.first_name} ${lead.last_name}`
    : lead.name || "Unnamed Lead";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all",
        "rounded-md border border-gray-200 dark:border-gray-800",
        "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm",
        isDragging && "opacity-90 shadow-lg rotate-1 scale-105"
      )}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-base">
            {displayName}
          </h3>
          
          {pipelineId && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 -mr-1 -mt-1"
              onClick={() => onImport(lead, pipelineId, "New")} // Default to "New" status
              title="Add to pipeline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {lead.email && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            <span>{lead.email}</span>
          </div>
        )}
        
        {lead.phone && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            <span>{lead.phone}</span>
          </div>
        )}
        
        {lead.pipeline_id ? (
          <div className="text-xs text-muted-foreground">
            In another pipeline
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Not assigned to any pipeline
          </div>
        )}
      </CardContent>
    </Card>
  );
}
