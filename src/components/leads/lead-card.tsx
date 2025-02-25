
import { useDraggable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing border border-border/50 bg-background/50 hover:bg-background/80 transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <CardContent className="p-4 space-y-2">
        <div className="font-medium">{lead.name}</div>
        {lead.email && (
          <div className="text-sm text-muted-foreground">{lead.email}</div>
        )}
        {lead.phone && (
          <div className="text-sm text-muted-foreground">{lead.phone}</div>
        )}
      </CardContent>
    </Card>
  );
}
