
import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { LeadsTable } from "@/components/leads/leads-table";
import { toast } from "sonner";

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

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          variables:lead_variables(*)
        `);

      if (leadsError) {
        toast.error("Failed to fetch leads");
        throw leadsError;
      }

      return leadsData as Lead[];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Sheet open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              Add Lead
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Lead</SheetTitle>
            </SheetHeader>
            <NewLeadForm 
              onSuccess={() => {
                setIsNewLeadOpen(false);
                refetch();
              }} 
            />
          </SheetContent>
        </Sheet>
      </div>

      <LeadsTable leads={leads || []} isLoading={isLoading} onLeadUpdated={() => refetch()} />
    </div>
  );
};

export default LeadsPage;
