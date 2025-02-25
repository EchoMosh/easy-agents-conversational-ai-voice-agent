
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody } from "@/components/ui/table";
import { Agent } from "@/types/agent";
import { AgentsTableHeader } from "./table/agents-table-header";
import { AgentsTableRow } from "./table/agents-table-row";
import { DeleteDialog } from "./table/delete-dialog";
import { LoadingOverlay } from "./table/loading-overlay";
import { SelectionHeader } from "./table/selection-header";

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
      await onDelete(agentToDelete);
      setAgentToDelete(null);
      setSelectedAgents(prev => prev.filter(id => id !== agentToDelete));
    } catch (error) {
      console.error("Error deleting agent:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (isDeleting || selectedAgents.length === 0) return;
    
    setIsDeleting(true);
    try {
      for (const id of selectedAgents) {
        await onDelete(id);
      }
      setSelectedAgents([]);
      setShowBulkDeleteDialog(false);
    } catch (error) {
      console.error("Error bulk deleting agents:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full relative">
      <SelectionHeader 
        selectedCount={selectedAgents.length}
        onDelete={() => setShowBulkDeleteDialog(true)}
        isDeleting={isDeleting}
      />

      <Table>
        <AgentsTableHeader
          selectedCount={selectedAgents.length}
          totalCount={agents.length}
          onToggleSelectAll={toggleSelectAll}
          isDeleting={isDeleting}
        />
        <TableBody>
          {agents.map((agent) => (
            <AgentsTableRow
              key={agent.id}
              agent={agent}
              isSelected={selectedAgents.includes(agent.id)}
              onToggleSelect={toggleSelect}
              onDelete={(id) => setAgentToDelete(id)}
              onEdit={(id) => navigate(`/dashboard/agents/flow/${id}`)}
              isDeleting={isDeleting}
            />
          ))}
        </TableBody>
      </Table>

      <DeleteDialog
        isOpen={!!agentToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setAgentToDelete(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the agent and all of its data."
      />

      <DeleteDialog
        isOpen={showBulkDeleteDialog}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setShowBulkDeleteDialog(false);
          }
        }}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
        title="Are you sure?"
        description={`This action cannot be undone. This will permanently delete ${selectedAgents.length} selected agents and all of their data.`}
      />

      {isDeleting && <LoadingOverlay />}
    </div>
  );
}
