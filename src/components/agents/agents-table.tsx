
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Agent } from "@/types/agent";
import { DeleteDialog } from "./table/delete-dialog";
import { Pencil, Trash, CheckCircle, XCircle, Share2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AgentFlowPreview } from "./agent-flow-preview";

interface AgentsTableProps {
  agents: Agent[];
  onDelete: (id: string) => Promise<void>;
}

export function AgentsTable({ agents = [], onDelete }: AgentsTableProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getAvatarUrl = (agentId: string, role: string) => {
    const seed = `${agentId}-${role}`;
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&size=200`;
  };

  const handleDelete = (agentId: string) => {
    setSelectedAgentId(agentId);
    setDeleteDialogOpen(true);
  };

  const handleEditFlow = (agentId: string) => {
    navigate(`/dashboard/agents/flow/${agentId}`);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAgentId || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(selectedAgentId);
    } catch (error) {
      console.error("Error deleting agent:", error);
    } finally {
      setIsDeleting(false);
      setSelectedAgentId(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setSelectedAgentId(null);
      setIsDeleting(false);
    }
  };

  if (agents.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <h3 className="text-xl font-medium mb-2">No agents found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first agent to get started
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="flex flex-col hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage 
                      src={getAvatarUrl(agent.id, agent.role)} 
                      alt={agent.name} 
                    />
                    <AvatarFallback>
                      {agent.name ? agent.name.substring(0, 2).toUpperCase() : "AG"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-semibold">{agent.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {agent.role ? agent.role.replace('_', ' ') : "Assistant"}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <span className="sr-only">Open menu</span>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditFlow(agent.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Flow
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(agent.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="flex-grow pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span 
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      agent.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {agent.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Fingerprint className="w-3 h-3 mr-1" />
                  <span className="font-mono">{agent.id ? agent.id.substring(0, 8) : "N/A"}</span>
                </div>
              </div>
              
              {/* Flow Preview */}
              <div className="pt-2">
                <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                  <Share2 className="h-3 w-3" />
                  <span>Flow Preview</span>
                </div>
                <AgentFlowPreview flowData={agent.flow} maxHeight={120} />
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground pt-0 border-t">
              <div className="flex w-full justify-between items-center">
                <span>Created {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : "Recently"}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditFlow(agent.id)}
                  className="h-8 text-xs"
                >
                  Edit Flow
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the agent and all of its data."
      />
    </div>
  );
}
