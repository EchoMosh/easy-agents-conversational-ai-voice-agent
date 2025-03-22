
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "./leads";
import { Send } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

interface ChatPageProps {
  leadId?: string;
}

export function ChatPage({ leadId }: ChatPageProps) {
  const [message, setMessage] = useState("");
  const params = useParams();
  const id = leadId || params.id;

  const { data: lead } = useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      // Add empty tags array to satisfy the Lead type
      return { ...data, tags: [] } as Lead;
    },
    enabled: !!id
  });

  if (!lead) return <div className="p-4">No lead selected or lead not found.</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">{lead.name}</h3>
        <p className="text-xs text-muted-foreground">
          {lead.email || lead.phone || "No contact info"}
        </p>
      </div>

      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="bg-muted w-fit max-w-[80%] rounded-lg px-4 py-2 text-sm">
            Hello! This is a placeholder message. The chat functionality is not implemented yet.
          </div>
        </div>
      </ScrollArea>

      {/* Chat input */}
      <div className="border-t p-4">
        <form 
          className="flex gap-2"
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
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
