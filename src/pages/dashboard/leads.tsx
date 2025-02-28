
import { useState, useEffect } from "react";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePipelineQueries } from "@/hooks/pipeline/use-pipeline-queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export interface LeadVariable {
  id: string;
  lead_id: string;
  name: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  pipeline_id: string;
  created_at: string;
  user_id: string;
  updated_at: string;
  variables?: LeadVariable[];
  tags?: any[];
}

export default function LeadsPage() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const { pipelines, leads, invalidateAndRefetch } = usePipelineQueries(selectedPipelineId);

  // Filter leads based on search query
  const filteredLeads = leads.filter(lead => {
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.phone && lead.phone.toLowerCase().includes(query)) ||
      lead.status.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
          <Button onClick={() => setIsNewLeadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Add New Lead</DialogTitle>
            </DialogHeader>
            <NewLeadForm onSuccess={() => {
              setIsNewLeadOpen(false);
              invalidateAndRefetch();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-6" />

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-10">
          {searchQuery ? (
            <p className="text-muted-foreground">No leads matching your search criteria.</p>
          ) : (
            <>
              <p className="text-muted-foreground">No leads found.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsNewLeadOpen(true)}
              >
                Add your first lead
              </Button>
            </>
          )}
        </div>
      )}

      {filteredLeads.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const pipelineName = lead.pipeline_id ? 
                  pipelines.find(p => p.id === lead.pipeline_id)?.name || 'Unknown' : 
                  'No Pipeline';
                  
                const createdAt = new Date(lead.created_at).toLocaleDateString();
                
                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                        {lead.status}
                      </span>
                    </TableCell>
                    <TableCell>{pipelineName}</TableCell>
                    <TableCell>{createdAt}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
