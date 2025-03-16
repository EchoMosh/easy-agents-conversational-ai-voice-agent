
import { useDraggable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";
import { Mail, Phone } from "lucide-react";

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
        "cursor-grab active:cursor-grabbing border-gray-200/70 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow",
        "hover:border-gray-300 dark:hover:border-gray-600 rounded-lg",
        isDragging && "opacity-50 shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className={cn(
          "font-medium text-base",
          theme === "light" ? "text-gray-800" : "text-gray-200"
        )}>
          {lead.name}
        </div>
        {lead.email && (
          <div className="text-sm text-muted-foreground/80 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="text-sm text-muted-foreground/80 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            <span>{lead.phone}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
