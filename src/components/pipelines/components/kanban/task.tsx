
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/pages/dashboard/leads";
import { Card } from "@/components/ui/card";
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
    disabled: isPreview,
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-manipulation ${
        isDragging ? "task-card-dragging" : ""
      } ${isPreview ? "task-card-preview" : ""}`}
      onClick={!isDragging ? onClick : undefined}
    >
      <Card className="bg-card border-border p-3 rounded-md shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer">
        <div className="space-y-1">
          <h4 className="font-medium text-card-foreground">
            {lead.first_name} {lead.last_name}
          </h4>
          {lead.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
