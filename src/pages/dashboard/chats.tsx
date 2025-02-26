import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./leads";
import { Clock, User, FileText, PlusCircle } from "lucide-react";
import { Command, CommandInput } from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LeadSidebar } from "@/components/chat/lead-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { TimelineTab } from "@/components/chat/tabs/timeline-tab";
import { InfoTab } from "@/components/chat/tabs/info-tab";

export default function ChatsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'note'>('email');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState<"timeline" | "details" | "files">("timeline");

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
        <div className="w-80 border-l flex flex-col bg-muted/10">
          <div className="p-4 border-b bg-background">
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder="Search timeline..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </Command>
          </div>
          
          <Tabs value={currentTab} onValueChange={(value: "timeline" | "details" | "files") => setCurrentTab(value)} className="flex-1 flex flex-col">
            <div className="px-4 py-2 border-b bg-background">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="timeline">
                  <Clock className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="details">
                  <User className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="files">
                  <FileText className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="timeline" className="m-0 p-4">
                <TimelineTab leadId={selectedLead.id} />
              </TabsContent>

              <TabsContent value="details" className="m-0 p-4">
                <InfoTab lead={selectedLead} />
              </TabsContent>

              <TabsContent value="files" className="m-0 p-4">
                <div className="space-y-4">
                  <Button className="w-full">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>

                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg bg-background">
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
            </ScrollArea>
          </Tabs>
        </div>
      )}
    </div>
  );
}
