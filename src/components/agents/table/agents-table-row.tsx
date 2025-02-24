
import React from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MoreVertical, Pencil, Trash, CheckSquare, Square } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Agent } from "@/types/agent";

interface AgentsTableRowProps {
  agent: Agent;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  isDeleting: boolean;
}

export function AgentsTableRow({
  agent,
  isSelected,
  onToggleSelect,
  onDelete,
  onEdit,
  isDeleting
}: AgentsTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleSelect(agent.id)}
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
      <TableCell className="font-medium">{agent.name}</TableCell>
      <TableCell className="capitalize">
        {agent.role.replace('_', ' ')}
      </TableCell>
      <TableCell>
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            agent.is_active 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}
        >
          {agent.is_active ? 'Active' : 'Inactive'}
        </span>
      </TableCell>
      <TableCell>
        {new Date(agent.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(agent.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Flow
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(agent.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
