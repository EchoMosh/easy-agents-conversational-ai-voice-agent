
import { useDraggable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
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
        "cursor-grab active:cursor-grabbing border-border/50 bg-card shadow-sm hover:shadow-md transition-all",
        "hover:scale-[1.02] hover:-translate-y-0.5 duration-200",
        isDragging && "opacity-50 ring-2 ring-primary/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="font-medium">{lead.name}</div>
        {lead.email && (
          <div className="text-sm text-muted-foreground/80">{lead.email}</div>
        )}
        {lead.phone && (
          <div className="text-sm text-muted-foreground/80">{lead.phone}</div>
        )}
      </CardContent>
    </Card>
  );
}
