
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./leads";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LeadSidebar } from "@/components/chat/lead-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { TimelineTab } from "@/components/chat/tabs/timeline-tab";
import { InfoTab } from "@/components/chat/tabs/info-tab";
import { History, UserCircle2, Files, PlusCircle } from "lucide-react";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";

type TabType = "timeline" | "details" | "files";

export default function ChatsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'note'>('email');
  const [currentTab, setCurrentTab] = useState<TabType>("timeline");

  console.log("ChatsPage render - selectedLeadId:", selectedLeadId);
  console.log("ChatsPage render - currentTab:", currentTab);

  useEffect(() => {
    console.log("ChatsPage effect - selectedLeadId changed to:", selectedLeadId);
  }, [selectedLeadId]);

  const { data: leads, refetch: refetchLeads, isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      console.log("Fetching leads...");
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          variables:lead_variables(*),
          tags:lead_tags(
            tag:tags(*)
          )
        `);
      
      if (error) {
        console.error("Error fetching leads:", error);
        throw error;
      }
      
      console.log("Leads fetched successfully:", data);
      return (data || []).map(lead => ({
        ...lead,
        tags: (lead.tags || []).map((tagRelation: any) => tagRelation.tag)
      })) as Lead[];
    }
  });

  // Log any lead loading errors
  if (leadsError) {
    console.error("Lead query error:", leadsError);
  }

  // Find the selected lead
  const selectedLead = leads?.find(lead => lead.id === selectedLeadId);
  console.log("Selected lead:", selectedLead);

  // Fetch pipeline information if we have a selected lead
  const { data: pipeline, isLoading: pipelineLoading, error: pipelineError } = useQuery({
    queryKey: ['pipeline', selectedLeadId],
    queryFn: async () => {
      console.log("Fetching pipeline for leadId:", selectedLeadId);
      const selectedLead = leads?.find(lead => lead.id === selectedLeadId);
      if (!selectedLead || !selectedLead.pipeline_id) {
        console.log("No pipeline_id found for selected lead");
        return null;
      }
      
      console.log("Fetching pipeline with id:", selectedLead.pipeline_id);
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('id', selectedLead.pipeline_id)
        .single();
      
      if (error) {
        console.error('Error fetching pipeline:', error);
        return null;
      }
      
      console.log("Raw pipeline data:", data);
      // Convert the raw pipeline data to our expected Pipeline type
      const convertedPipeline = convertJsonToPipeline(data);
      console.log("Converted pipeline:", convertedPipeline);
      return convertedPipeline;
    },
    enabled: !!selectedLeadId && !!leads?.find(lead => lead.id === selectedLeadId)?.pipeline_id
  });

  // Log any pipeline loading errors
  if (pipelineError) {
    console.error("Pipeline query error:", pipelineError);
  }

  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    setCurrentTab(value as TabType);
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      <LeadSidebar
        leads={leads}
        selectedLeadId={selectedLeadId}
        onLeadSelect={(id) => {
          console.log("Lead selected:", id);
          setSelectedLeadId(id);
        }}
      />

      <ChatArea
        selectedLead={selectedLead}
        messageType={messageType}
        onMessageTypeChange={setMessageType}
      />

      {selectedLead && (
        <div className="w-80 border-l flex flex-col bg-background h-full overflow-hidden">
          <Tabs defaultValue="timeline" value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col h-full">
            <div className="border-b">
              <TabsList className="w-full grid grid-cols-3 bg-transparent h-14 rounded-none">
                <TabsTrigger 
                  value="timeline" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-full"
                >
                  <History className="w-5 h-5 stroke-[1.5]" />
                </TabsTrigger>
                <TabsTrigger 
                  value="details" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-full"
                  onClick={() => {
                    console.log("Details tab clicked");
                  }}
                >
                  <UserCircle2 className="w-5 h-5 stroke-[1.5]" />
                </TabsTrigger>
                <TabsTrigger 
                  value="files" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-full"
                >
                  <Files className="w-5 h-5 stroke-[1.5]" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timeline" className="flex-1 m-0 overflow-hidden">
              <TimelineTab leadId={selectedLead.id} />
            </TabsContent>

            <TabsContent value="details" className="m-0 overflow-auto">
              <InfoTab lead={selectedLead} pipeline={pipeline} />
            </TabsContent>

            <TabsContent value="files" className="m-0 p-4 overflow-auto">
              <div className="space-y-4">
                <Button className="w-full bg-white hover:bg-gray-50 text-black border shadow-sm dark:bg-background dark:hover:bg-muted dark:text-foreground">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Upload File
                </Button>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-gray-50 border dark:bg-muted">
                    <div className="flex items-center gap-3">
                      <Files className="h-8 w-8 text-purple-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">proposal.pdf</p>
                        <p className="text-xs text-muted-foreground">Added 2 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
