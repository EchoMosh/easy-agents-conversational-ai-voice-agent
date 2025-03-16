
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Pencil } from "lucide-react";
import { LeadRowProps, statusColors } from "../types/lead-types";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeadVariable } from "@/pages/dashboard/leads";

export function LeadRow({ 
  lead, 
  isSelected, 
  onToggleSelect, 
  onLeadUpdated,
  isDeleting,
  pipelineName 
}: LeadRowProps) {
  const { theme } = useTheme();
  const [variableCount, setVariableCount] = useState(0);

  // Fetch variable count from database when component mounts
  useEffect(() => {
    const fetchVariableCount = async () => {
      try {
        const { data, error, count } = await supabase
          .from("lead_variables")
          .select("*", { count: 'exact' })
          .eq("lead_id", lead.id);
        
        if (error) throw error;
        setVariableCount(count || 0);
      } catch (error) {
        console.error("Error fetching variables count:", error);
      }
    };

    fetchVariableCount();
  }, [lead.id]);

  return (
    <TableRow className={cn(
      "transition-colors border-b hover:bg-muted/20", 
      isSelected ? "bg-muted/30" : ""
    )}>
      <TableCell className="w-12 p-0 pl-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(lead.id)}
          disabled={isDeleting}
          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground rounded-sm"
          aria-label={`Select ${lead.name}`}
        />
      </TableCell>
      <TableCell className="font-medium">{lead.name}</TableCell>
      <TableCell className="text-muted-foreground">{lead.email || "-"}</TableCell>
      <TableCell className="text-muted-foreground">{lead.phone || "-"}</TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={cn(
            "px-2.5 py-0.5 text-xs font-medium",
            statusColors[lead.status as keyof typeof statusColors] || "bg-gray-500",
            theme === "light" ? "text-black" : "text-white"
          )}
        >
          {lead.status}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{pipelineName || "-"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => lead.onVariableClick?.(lead)} className="hover:bg-muted">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className={variableCount > 0 ? "text-primary font-medium" : "text-muted-foreground"}>
                    {variableCount} {variableCount === 1 ? "Variable" : "Variables"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Manage lead variables</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => lead.onEditClick?.(lead)} className="hover:bg-muted">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Edit lead</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}
