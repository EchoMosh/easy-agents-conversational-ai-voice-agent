
import React from "react";
import { Button } from "@/components/ui/button";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Square } from "lucide-react";

interface AgentsTableHeaderProps {
  selectedCount: number;
  totalCount: number;
  onToggleSelectAll: () => void;
  isDeleting: boolean;
}

export function AgentsTableHeader({
  selectedCount,
  totalCount,
  onToggleSelectAll,
  isDeleting
}: AgentsTableHeaderProps) {
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
            {selectedCount === totalCount ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        </TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Created</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
