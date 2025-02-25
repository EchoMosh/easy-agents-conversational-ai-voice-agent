
import { useDraggable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { theme } = useTheme();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition: 'transform 0ms',
        zIndex: 50,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing border-border/50 bg-card shadow-sm transition-[shadow,opacity]",
        "hover:shadow-md",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className={cn(
          "font-medium",
          theme === "light" ? "text-black" : "text-white"
        )}>
          {lead.name}
        </div>
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
