
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { LeadsTable } from "@/components/leads/leads-table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  pipeline_id: string;
  created_at: string;
  variables?: LeadVariable[];
  tags?: Tag[];
}

export type LeadVariable = {
  id: string;
  lead_id: string;
  name: string;
  value: string | null;
};

const LeadsPage = () => {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    data: leads,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          variables:lead_variables(*),
          tags:lead_tags(
            tag:tags(*)
          )
        `);

      if (leadsError) {
        toast.error("Failed to fetch leads");
        throw leadsError;
      }

      // Transform the nested tag structure
      return leadsData?.map(lead => ({
        ...lead,
        tags: lead.tags?.map((t: any) => t.tag) || []
      })) as Lead[];
    }
  });

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchQuery));
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none shadow-2xl">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl py-[7px]">Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 overflow-y-auto max-h-[80vh]">
              <NewLeadForm onSuccess={() => {
                setIsNewLeadOpen(false);
                refetch();
              }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <LeadsTable leads={filteredLeads} isLoading={isLoading} onLeadUpdated={() => refetch()} />
    </div>
  );
};

export default LeadsPage;
