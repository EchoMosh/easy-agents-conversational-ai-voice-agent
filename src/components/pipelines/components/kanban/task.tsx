
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/pages/dashboard/leads";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";

interface KanbanTaskProps {
  lead: Lead;
  columnId: string;
  onClick: () => void;
  isPreview?: boolean;
}

export function KanbanTask({ lead, columnId, onClick, isPreview = false }: KanbanTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: "Task",
      lead,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-manipulation ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${isPreview ? "task-card-preview" : ""}`}
    >
      <Card 
        className={`bg-card hover:bg-accent/40 cursor-pointer border border-border shadow-sm ${
          isPreview ? "border-primary bg-primary/10" : ""
        }`}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="font-medium text-sm text-foreground">{lead.name}</div>
            
            <div className="space-y-1">
              {lead.email && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{lead.email}</span>
                </div>
              )}
              
              {lead.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{lead.phone}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
