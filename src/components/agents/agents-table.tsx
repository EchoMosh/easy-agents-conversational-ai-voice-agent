
import { MoreVertical, Pencil, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Agent } from "@/types/agent";

interface AgentsTableProps {
  agents: Agent[];
  onDelete: (id: string) => void;
}

export function AgentsTable({ agents, onDelete }: AgentsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
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
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => navigate(`/dashboard/agents/flow/${agent.id}`)}
                    >
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
