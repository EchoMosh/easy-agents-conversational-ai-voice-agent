
import { useState } from "react";
import { Lead } from "@/pages/dashboard/leads";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Pencil, Square, CheckSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LeadVariables } from "./lead-variables";
import { EditLeadForm } from "./edit-lead-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/agents/table/delete-dialog";
import { SelectionHeader } from "@/components/agents/table/selection-header";
import { useQuery } from "@tanstack/react-query";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadUpdated: () => void;
}

const statusColors = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-green-500",
  converted: "bg-purple-500",
  lost: "bg-red-500",
};

export function LeadsTable({ leads, isLoading, onLeadUpdated }: LeadsTableProps) {
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch available pipelines
  const { data: pipelines = [] } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleToggleSelect = (id: string) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    setSelectedLeads(prev => 
      prev.length === leads.length ? [] : leads.map(lead => lead.id)
    );
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedLeads);

      if (error) throw error;

      toast.success(`Successfully deleted ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}`);
      setSelectedLeads([]);
      onLeadUpdated();
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Failed to delete leads');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleMoveToPipeline = async (pipelineId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ pipeline_id: pipelineId })
        .in('id', selectedLeads);

      if (error) throw error;

      toast.success(`Successfully moved ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} to pipeline`);
      setSelectedLeads([]);
      onLeadUpdated();
    } catch (error) {
      console.error('Error moving leads:', error);
      toast.error('Failed to move leads');
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading leads...</div>;
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No leads found. Add your first lead to get started.
      </div>
    );
  }

  return (
    <>
      <SelectionHeader
        selectedCount={selectedLeads.length}
        onDelete={() => setIsDeleteDialogOpen(true)}
        isDeleting={isDeleting}
        onMoveToPipeline={handleMoveToPipeline}
        pipelines={pipelines}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleSelectAll}
                  className="h-8 w-8"
                  disabled={isDeleting}
                >
                  {selectedLeads.length === leads.length ? (
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
              <TableHead>Variables</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleSelect(lead.id)}
                    className="h-8 w-8"
                    disabled={isDeleting}
                  >
                    {selectedLeads.includes(lead.id) ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.email || "-"}</TableCell>
                <TableCell>{lead.phone || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${statusColors[lead.status]} text-white`}
                  >
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Tag className="h-4 w-4 mr-2" />
                        {lead.variables?.length || 0} Variables
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none shadow-2xl">
                      <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-2xl py-[7px]">Lead Variables</DialogTitle>
                      </DialogHeader>
                      <div className="px-6 pb-6 overflow-y-auto max-h-[80vh]">
                        <LeadVariables
                          leadId={lead.id}
                          variables={lead.variables || []}
                          onVariablesUpdated={onLeadUpdated}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setEditingLead(lead)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none shadow-2xl">
                      <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-2xl py-[7px]">Edit Lead</DialogTitle>
                      </DialogHeader>
                      <div className="px-6 pb-6 overflow-y-auto max-h-[80vh]">
                        {editingLead && (
                          <EditLeadForm
                            lead={editingLead}
                            onSuccess={() => {
                              setEditingLead(null);
                              onLeadUpdated();
                            }}
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title={`Delete ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}?`}
        description="This action cannot be undone. This will permanently delete the selected leads and remove their data from our servers."
      />
    </>
  );
}
