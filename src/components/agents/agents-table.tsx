
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
  Search,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
        <div className="rounded-xl border border-border/40 shadow-sm bg-card/50 overflow-hidden backdrop-blur-sm">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[300px] font-medium">Agent</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">ID</TableHead>
                  <TableHead className="font-medium">Created</TableHead>
                  <TableHead className="text-right font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <React.Fragment key={agent.id}>
                    <TableRow className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 rounded-md border border-primary/10 bg-secondary/20">
                            <AvatarImage 
                              src={getAvatarUrl(agent.id, agent.role)} 
                              alt={agent.name} 
                            />
                            <AvatarFallback className="rounded-md bg-gradient-to-br from-primary/10 to-primary/5">
                              {agent.name ? agent.name.substring(0, 2).toUpperCase() : "AG"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">{agent.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{agent.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={agent.is_active ? "default" : "outline"}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs ${
                            agent.is_active 
                              ? 'bg-green-100/50 text-green-800 hover:bg-green-100/50 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/30' 
                              : 'bg-secondary/30 text-muted-foreground'
                          }`}
                        >
                          {agent.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">
                          {agent.id ? agent.id.substring(0, 8) : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : "Recently"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
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
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem onClick={() => handleEditFlow(agent.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(agent.id)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/10"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className={expandedAgents[agent.id] ? "border-t-0" : "hidden"}>
                      <TableCell colSpan={5} className="p-0 border-t-0 bg-secondary/10">
                        <Collapsible open={expandedAgents[agent.id]} className="w-full">
                          <CollapsibleContent className="px-4 py-3">
                            <div className="pt-1 w-full">
                              <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                                <Share2 className="h-3 w-3" />
                                <span>Flow Preview</span>
                              </div>
                              <div className="rounded-lg overflow-hidden border border-border/50 bg-card/80">
                                <AgentFlowPreview flowData={agent.flow} maxHeight={180} />
                              </div>
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
