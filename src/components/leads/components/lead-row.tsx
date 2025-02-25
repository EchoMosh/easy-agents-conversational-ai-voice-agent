
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square } from "lucide-react";
import { LeadRowProps, statusColors } from "../types/lead-types";
import { LeadActions } from "./lead-actions";

export function LeadRow({ 
  lead, 
  isSelected, 
  onToggleSelect, 
  onLeadUpdated,
  isDeleting,
  pipelineName 
}: LeadRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleSelect(lead.id)}
          className="h-8 w-8"
          disabled={isDeleting}
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
      <TableCell>{lead.name}</TableCell>
      <TableCell>{lead.email || "-"}</TableCell>
      <TableCell>{lead.phone || "-"}</TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={`${statusColors[lead.status]} text-white`}
        >
          {lead.status}
        </Badge>
      </TableCell>
      <TableCell>{pipelineName || "-"}</TableCell>
      <TableCell>
        <LeadActions lead={lead} onEditSuccess={onLeadUpdated} />
      </TableCell>
      <TableCell>
        <LeadActions lead={lead} onEditSuccess={onLeadUpdated} />
      </TableCell>
    </TableRow>
  );
}
