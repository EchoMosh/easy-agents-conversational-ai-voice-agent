
import React, { useState } from "react";
import { MoreVertical, Pencil, Trash, CheckSquare, Square } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Agent } from "@/types/agent";

interface AgentsTableProps {
  agents: Agent[];
  onDelete: (id: string) => Promise<void>;
}

export function AgentsTable({ agents, onDelete }: AgentsTableProps) {
  const navigate = useNavigate();
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelectAll = () => {
    if (selectedAgents.length === agents.length) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(agents.map(agent => agent.id));
    }
  };

  const toggleSelect = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId));
    } else {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!agentToDelete || isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      // Store the ID before clearing state
      const idToDelete = agentToDelete;
      
      // Close dialog with a small delay to ensure proper visual transition
      await new Promise(resolve => setTimeout(resolve, 100));
      setAgentToDelete(null);
      
      // Wait a bit more to ensure dialog is fully closed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Perform deletion
      await onDelete(idToDelete);
      
      // Final cleanup delay
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (isDeleting || selectedAgents.length === 0) return;
    
    setIsDeleting(true);
    
    try {
      // Store IDs before clearing state
      const agentsToDelete = [...selectedAgents];
      
      // Close dialog with a small delay to ensure proper visual transition
      await new Promise(resolve => setTimeout(resolve, 100));
      setShowBulkDeleteDialog(false);
      
      // Clear selection with a small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      setSelectedAgents([]);
      
      // Perform deletions one by one
      for (const id of agentsToDelete) {
        await onDelete(id);
      }
      
      // Final cleanup delay
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleting) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-lg font-medium">Deleting...</p>
          <p className="text-sm text-muted-foreground">Please wait while we process your request.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {selectedAgents.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-muted p-4 rounded-lg">
          <span className="text-sm font-medium">
            {selectedAgents.length} agent{selectedAgents.length > 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSelectAll}
                className="h-8 w-8"
                disabled={isDeleting}
              >
                {selectedAgents.length === agents.length ? (
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
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleSelect(agent.id)}
                  className="h-8 w-8"
                  disabled={isDeleting}
                >
                  {selectedAgents.includes(agent.id) ? (
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
                    <DropdownMenuItem 
                      onClick={() => navigate(`/dashboard/agents/flow/${agent.id}`)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Flow
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setAgentToDelete(agent.id)}
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

      <AlertDialog 
        open={!!agentToDelete} 
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setAgentToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the agent
              and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={showBulkDeleteDialog}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setShowBulkDeleteDialog(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedAgents.length} selected agents
              and all of their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
