
import { Button } from "@/components/ui/button";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Square } from "lucide-react";
import { LeadTableHeaderProps } from "../types/lead-types";

export function LeadTableHeader({ onToggleSelectAll, isAllSelected, isDeleting }: LeadTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSelectAll}
            className="h-8 w-8"
            disabled={isDeleting}
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        </TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Phone</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Pipeline</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
