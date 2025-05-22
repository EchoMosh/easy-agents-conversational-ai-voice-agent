
import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Agent } from "@/types/agent";
import { DeleteDialog } from "./table/delete-dialog";
import { 
  Pencil, 
  Trash, 
  CheckCircle, 
  XCircle,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

interface AgentsTableProps {
  agents: Agent[];
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean; // Add isLoading prop
}

export function AgentsTable({ agents = [], onDelete, isLoading }: AgentsTableProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const checkboxRef = useRef<HTMLButtonElement>(null);

  const handleDelete = (agentId: string) => {
    setSelectedAgentId(agentId);
    setDeleteDialogOpen(true);
  };

  const handleEditFlow = (agentId: string) => {
    // Always navigate to the main flow page; AgentFlowPage will handle beta/stable rendering
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

  const handleBulkDelete = async () => {
    if (selectedAgents.length === 0 || isDeleting) return;
    
    setIsDeleting(true);
    try {
      // Create a promise for each deletion and wait for all to complete
      await Promise.all(selectedAgents.map(id => onDelete(id)));
      setSelectedAgents([]);
    } catch (error) {
      console.error("Error deleting agents:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setSelectedAgentId(null);
      setIsDeleting(false);
    }
  };
  
  // Sort agents
  const sortedAgents = useMemo(() => {
    let result = [...agents];
    
    // Sort by the selected column
    result.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortColumn) {
        case "name":
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case "role":
          valueA = a.role.toLowerCase();
          valueB = b.role.toLowerCase();
          break;
        case "status":
          valueA = a.is_active ? 1 : 0;
          valueB = b.is_active ? 1 : 0;
          break;
        case "created_at":
          valueA = new Date(a.created_at || 0).getTime();
          valueB = new Date(b.created_at || 0).getTime();
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }
      
      return sortDirection === "asc" 
        ? valueA > valueB ? 1 : -1
        : valueA < valueB ? 1 : -1;
    });
    
    return result;
  }, [agents, sortColumn, sortDirection]);

  // Toggle selection of a single agent
  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  // Toggle selection of all agents
  const toggleAllAgents = () => {
    if (selectedAgents.length === sortedAgents.length) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(sortedAgents.map(agent => agent.id));
    }
  };

  // Sort handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Check if all agents are selected
  const isAllSelected = sortedAgents.length > 0 && selectedAgents.length === sortedAgents.length;

  // Check if some but not all agents are selected
  const isSomeSelected = selectedAgents.length > 0 && selectedAgents.length < sortedAgents.length;

  if (isLoading) {
    return (
      <div className="w-full relative space-y-4">
        <div className="flex justify-between items-center mb-4">
          {/* Placeholder for bulk actions if needed */}
        </div>
        <div className="rounded-md border dark:border-zinc-800 shadow-sm bg-card overflow-hidden">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[40px] pl-4">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                  <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-[70px]" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-[90px]" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-4"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    );
  }

  if (agents.length === 0 && !isLoading) { // Ensure isLoading is false for empty state
    return (
      <div className="text-center p-8 border dark:border-zinc-800 rounded-lg bg-muted/20">
        <h3 className="text-xl font-medium mb-2">No agents found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first agent to get started
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative space-y-4">
      <div className="flex justify-between items-center mb-4">
        {selectedAgents.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeleting}
          >
            <Trash className="h-4 w-4 mr-1" />
            Delete {selectedAgents.length} selected
          </Button>
        )}
      </div>

      <div className="rounded-md border dark:border-zinc-800 shadow-sm bg-card overflow-hidden">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[40px] pl-4">
                  <Checkbox 
                    ref={checkboxRef}
                    checked={isAllSelected} 
                    className="data-[state=indeterminate]:bg-primary"
                    onCheckedChange={toggleAllAgents}
                    aria-label="Select all agents"
                    data-state={isSomeSelected ? "indeterminate" : isAllSelected ? "checked" : "unchecked"}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    Agent
                    {sortColumn === "name" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("role")}>
                  <div className="flex items-center">
                    Role
                    {sortColumn === "role" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                  <div className="flex items-center">
                    Status
                    {sortColumn === "status" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                  <div className="flex items-center">
                    Created
                    {sortColumn === "created_at" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAgents.map((agent) => (
                <TableRow 
                  key={agent.id}
                  className="hover:bg-muted/20 transition-colors"
                  data-selected={selectedAgents.includes(agent.id)}
                >
                  <TableCell className="pl-4">
                    <Checkbox 
                      checked={selectedAgents.includes(agent.id)}
                      onCheckedChange={() => toggleAgentSelection(agent.id)}
                      aria-label={`Select ${agent.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{agent.name}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">
                      {agent.role.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={agent.is_active ? "default" : "outline"}
                      className={`inline-flex items-center gap-1 ${
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
                    <span className="text-sm text-muted-foreground">
                      {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : "Recently"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditFlow(agent.id)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
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
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
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
