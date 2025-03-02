
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Agent } from "@/types/agent";
import { DeleteDialog } from "./table/delete-dialog";
import { 
  Pencil, 
  Trash, 
  CheckCircle, 
  XCircle, 
  Share2, 
  Fingerprint, 
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AgentFlowPreview } from "./agent-flow-preview";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentsTableProps {
  agents: Agent[];
  onDelete: (id: string) => Promise<void>;
}

export function AgentsTable({ agents = [], onDelete }: AgentsTableProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});

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
  
  // Filter agents based on search query
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    
    const query = searchQuery.toLowerCase();
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(query) || 
      agent.role.toLowerCase().includes(query) ||
      agent.id.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  const toggleAgentExpansion = (agentId: string) => {
    setExpandedAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
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
    <div className="w-full relative space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search agents..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="text-center py-10 px-4">
          <p className="text-muted-foreground">No agents match your search criteria</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[300px]">Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <React.Fragment key={agent.id}>
                    <TableRow className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-9 w-9 border border-primary/10">
                            <AvatarImage 
                              src={getAvatarUrl(agent.id, agent.role)} 
                              alt={agent.name} 
                            />
                            <AvatarFallback>
                              {agent.name ? agent.name.substring(0, 2).toUpperCase() : "AG"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{agent.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            agent.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'
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
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">
                          {agent.id ? agent.id.substring(0, 8) : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : "Recently"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAgentExpansion(agent.id)}
                            className="h-8 text-xs"
                          >
                            <span className="mr-1">Flow</span>
                            {expandedAgents[agent.id] ? 
                              <ChevronUp className="w-3 h-3" /> : 
                              <ChevronDown className="w-3 h-3" />
                            }
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditFlow(agent.id)}
                            className="h-8 text-xs"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(agent.id)}
                            className="h-8 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className={expandedAgents[agent.id] ? "" : "hidden"}>
                      <TableCell colSpan={5} className="p-0 border-t-0">
                        <Collapsible open={expandedAgents[agent.id]} className="w-full">
                          <CollapsibleContent className="px-4 pb-4">
                            <div className="pt-2 w-full">
                              <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                                <Share2 className="h-3 w-3" />
                                <span>Flow Preview</span>
                              </div>
                              <AgentFlowPreview flowData={agent.flow} maxHeight={180} />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

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
