
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadVariable } from "@/pages/dashboard/leads";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VariableBadgeProps {
  variable: LeadVariable;
  onEdit: (variable: LeadVariable) => void;
  onDelete: (id: string) => void;
}

export function VariableBadge({ variable, onEdit, onDelete }: VariableBadgeProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="font-medium text-sm truncate mr-2">{variable.name}:</span>
          <span className="text-sm text-muted-foreground truncate">{variable.value || "-"}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 ml-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onEdit(variable)}
                className="h-7 w-7 rounded-full hover:bg-muted-foreground/20"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Edit variable</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(variable.id)}
                className="h-7 w-7 rounded-full hover:bg-destructive/20"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Delete variable</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
