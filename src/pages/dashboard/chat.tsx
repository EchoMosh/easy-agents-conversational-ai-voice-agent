
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "./leads";
import { Send } from "lucide-react";
import { useState } from "react";

export default function ChatPage() {
  const { leadId } = useParams();
  const [message, setMessage] = useState("");

  const { data: lead } = useQuery({
    queryKey: ['leads', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (error) throw error;
      return data as Lead;
    }
  });

  if (!lead) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">{lead.name}</h1>
        <p className="text-sm text-muted-foreground">
          {lead.email || lead.phone || "No contact info"}
        </p>
      </div>

      {/* Chat messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          <div className="bg-muted w-fit max-w-[80%] rounded-lg px-4 py-2 text-sm">
            Hello! This is a placeholder message. The chat functionality is not implemented yet.
          </div>
        </div>
      </ScrollArea>

      {/* Chat input */}
      <div className="border-t p-4">
        <form 
          className="flex gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            // This is where we would handle sending the message
            setMessage("");
          }}
        >
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
