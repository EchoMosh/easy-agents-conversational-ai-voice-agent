
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square } from "lucide-react";
import { LeadRowProps, statusColors } from "../types/lead-types";
import { LeadActions } from "./lead-actions";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export function LeadRow({ 
  lead, 
  isSelected, 
  onToggleSelect, 
  onLeadUpdated,
  isDeleting,
  pipelineName 
}: LeadRowProps) {
  const { theme } = useTheme();

  return (
    <TableRow className={isSelected ? "bg-muted/50" : ""}>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(lead.id)}
          disabled={isDeleting}
          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
      </TableCell>
      <TableCell>{lead.name}</TableCell>
      <TableCell>{lead.email || "-"}</TableCell>
      <TableCell>{lead.phone || "-"}</TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={cn(
            statusColors[lead.status as keyof typeof statusColors] || "bg-gray-500",
            theme === "light" ? "text-black" : "text-white"
          )}
        >
          {lead.status}
        </Badge>
      </TableCell>
      <TableCell>{pipelineName || "-"}</TableCell>
      <TableCell>
        <LeadActions lead={lead} onEditSuccess={onLeadUpdated} />
      </TableCell>
    </TableRow>
  );
}
