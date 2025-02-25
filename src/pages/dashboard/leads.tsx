import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { LeadsTable } from "@/components/leads/leads-table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  created_at: string;
  variables?: LeadVariable[];
};
export type LeadVariable = {
  id: string;
  lead_id: string;
  name: string;
  value: string | null;
};
const LeadsPage = () => {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const {
    data: leads,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const {
        data: leadsData,
        error: leadsError
      } = await supabase.from('leads').select(`
          *,
          variables:lead_variables(*)
        `);
      if (leadsError) {
        toast.error("Failed to fetch leads");
        throw leadsError;
      }
      return leadsData as Lead[];
    }
  });
  return <div className="p-6 space-y-6">
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

      <LeadsTable leads={leads || []} isLoading={isLoading} onLeadUpdated={() => refetch()} />
    </div>;
};
export default LeadsPage;