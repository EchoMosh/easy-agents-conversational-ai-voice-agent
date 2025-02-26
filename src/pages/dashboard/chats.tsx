
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./leads";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LeadSidebar } from "@/components/chat/lead-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { TimelineTab } from "@/components/chat/tabs/timeline-tab";
import { InfoTab } from "@/components/chat/tabs/info-tab";
import { Clock, User, FileText, PlusCircle } from "lucide-react";

type TabType = "timeline" | "details" | "files";

export default function ChatsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'note'>('email');
  const [currentTab, setCurrentTab] = useState<TabType>("timeline");

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          variables:lead_variables(*)
        `);
      
      if (error) throw error;
      return data as Lead[];
    }
  });

  const selectedLead = leads?.find(lead => lead.id === selectedLeadId);

  const handleTabChange = (value: string) => {
    setCurrentTab(value as TabType);
  };

  return (
    <div className="flex h-screen bg-background">
      <LeadSidebar
        leads={leads}
        selectedLeadId={selectedLeadId}
        onLeadSelect={setSelectedLeadId}
      />

      <ChatArea
        selectedLead={selectedLead}
        messageType={messageType}
        onMessageTypeChange={setMessageType}
      />

      {selectedLead && (
        <div className="w-80 border-l flex flex-col bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-xl">
          <Tabs defaultValue="timeline" value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
            <div className="px-4 py-2 border-b bg-white/50 backdrop-blur-sm">
              <TabsList className="w-full grid grid-cols-3 bg-white/80">
                <TabsTrigger value="timeline" className="data-[state=active]:bg-white">
                  <Clock className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-white">
                  <User className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="files" className="data-[state=active]:bg-white">
                  <FileText className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timeline" className="m-0 flex-1">
              <TimelineTab leadId={selectedLead.id} />
            </TabsContent>

            <TabsContent value="details" className="m-0 p-4">
              <InfoTab lead={selectedLead} />
            </TabsContent>

            <TabsContent value="files" className="m-0 p-4">
              <div className="space-y-4">
                <Button className="w-full bg-white/80 hover:bg-white/90 text-black border shadow-sm">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Upload File
                </Button>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border shadow-sm">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
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
