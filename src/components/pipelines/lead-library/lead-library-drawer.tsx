
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Lead } from "@/pages/dashboard/leads";
import { LibraryLeadCard } from "./library-lead-card";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LeadLibraryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPipelineId: string | undefined;
  pipelineLeads: Lead[];
  allLeads: Lead[];
}

export function LeadLibraryDrawer({
  open,
  onOpenChange,
  currentPipelineId,
  pipelineLeads,
  allLeads
}: LeadLibraryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter leads that are not in the current pipeline
  useEffect(() => {
    if (!currentPipelineId) {
      setAvailableLeads([]);
      return;
    }

    // Get leads that are not in any pipeline or are in a different pipeline
    const filteredLeads = allLeads.filter(lead => 
      lead.pipeline_id !== currentPipelineId
    );

    setAvailableLeads(filteredLeads);
  }, [currentPipelineId, allLeads, pipelineLeads]);

  // Filter by search query
  const filteredLeads = searchQuery
    ? availableLeads.filter(lead => {
        const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
        const email = lead.email?.toLowerCase() || "";
        const phone = lead.phone?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || 
               email.includes(query) || 
               phone.includes(query);
      })
    : availableLeads;

  const handleImportLead = async (lead: Lead, pipelineId: string, status: string) => {
    if (isLoading || !pipelineId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          pipeline_id: pipelineId,
          status: status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', lead.id);
      
      if (error) throw error;
      
      // Refetch data to update UI
      queryClient.invalidateQueries({
        queryKey: ['leads']
      });
      
      queryClient.invalidateQueries({
        queryKey: ['pipelines']
      });
      
      toast({
        title: "Lead added to pipeline",
        description: `${lead.first_name} ${lead.last_name} added to pipeline`
      });
    } catch (error) {
      console.error('Error importing lead to pipeline:', error);
      toast({
        title: "Error adding lead",
        description: "There was a problem adding the lead to the pipeline",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Lead Library</SheetTitle>
          <SheetDescription>
            Drag leads from the library into your pipeline columns
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-6 pt-4 pb-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search leads by name, email, phone..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-6 pt-4">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No leads match your search" 
                  : "No leads available to add to this pipeline"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map(lead => (
                <LibraryLeadCard 
                  key={lead.id} 
                  lead={lead} 
                  pipelineId={currentPipelineId}
                  onImport={handleImportLead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
