
import { Tag, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadVariable } from "@/pages/dashboard/leads";

interface VariableBadgeProps {
  variable: LeadVariable;
  onEdit: (variable: LeadVariable) => void;
  onDelete: (id: string) => void;
}

export function VariableBadge({ variable, onEdit, onDelete }: VariableBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="pl-3 pr-2 py-1.5 h-8 text-sm bg-background/80 hover:bg-background/90 transition-all duration-200 border border-border/50 shadow-sm"
    >
      <Tag className="w-3 h-3 mr-2 opacity-50" />
      <span className="font-normal">{variable.name}:</span>
      <span className="font-medium ml-1">{variable.value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onEdit(variable)}
        className="h-5 w-5 ml-2 hover:bg-background/80 rounded-full"
      >
        <Plus className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(variable.id)}
        className="h-5 w-5 hover:bg-background/80 rounded-full"
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
}
