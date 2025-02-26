
import { Mail, MessageSquare, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./leads";
import { Textarea } from "@/components/ui/textarea";

export default function ChatsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'chat' | 'email' | 'sms'>('chat');
  const [message, setMessage] = useState("");

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    }
  });

  const selectedLead = leads?.find(lead => lead.id === selectedLeadId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement sending message based on messageType
    console.log(`Sending ${messageType}:`, message);
    setMessage("");
  };

  return (
    <div className="flex h-screen">
      {/* Leads sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <Input placeholder="Search leads..." className="w-full" />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {leads?.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedLeadId === lead.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  {lead.name[0].toUpperCase()}
                </span>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">{lead.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.email || lead.phone || "No contact info"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedLead ? (
          <>
            <div className="border-b p-4">
              <h2 className="text-2xl font-bold">{selectedLead.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedLead.email || selectedLead.phone || "No contact info"}
              </p>
            </div>

            <Tabs value={messageType} onValueChange={(v) => setMessageType(v as typeof messageType)} className="flex-1 flex flex-col">
              <div className="border-b px-4">
                <TabsList>
                  <TabsTrigger value="chat" className="flex gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="flex gap-2">
                    <Phone className="h-4 w-4" />
                    SMS
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 flex flex-col">
                <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {/* TODO: Add chat messages here */}
                      <div className="w-fit max-w-[80%] rounded-lg bg-muted px-4 py-2 text-sm">
                        This is where chat messages will appear
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="email" className="flex-1 flex flex-col m-0 p-4">
                  <Input
                    type="text"
                    placeholder="Subject"
                    className="mb-2"
                  />
                  <ScrollArea className="flex-1">
                    <Textarea
                      placeholder="Type your email..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="sms" className="flex-1 flex flex-col m-0 p-4">
                  <ScrollArea className="flex-1">
                    <Textarea
                      placeholder="Type your SMS..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </ScrollArea>
                </TabsContent>

                <div className="border-t p-4">
                  <form onSubmit={handleSend} className="flex gap-2">
                    {messageType === 'chat' && (
                      <Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1"
                      />
                    )}
                    <Button type="submit">
                      Send {messageType === 'chat' ? '' : messageType.toUpperCase()}
                    </Button>
                  </form>
                </div>
              </div>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a lead to start messaging
          </div>
        )}
      </div>

      {/* Activity/History sidebar */}
      {selectedLead && (
        <div className="w-80 border-l p-4">
          <h3 className="font-semibold mb-4">Activity History</h3>
          <div className="space-y-4">
            {/* TODO: Add activity items here */}
            <div className="text-sm text-muted-foreground">
              <time className="text-xs">Today at 2:30 PM</time>
              <p>Email sent: Follow-up meeting</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <time className="text-xs">Today at 1:15 PM</time>
              <p>Status changed to Qualified</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <time className="text-xs">Yesterday at 4:45 PM</time>
              <p>Added to Pipeline: Sales 2024</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
