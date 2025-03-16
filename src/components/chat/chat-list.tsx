
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/pages/dashboard/leads";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatContact } from "./chat-contact";
import { Search } from "lucide-react";
import { useState } from "react";

export function ChatList() {
  const [search, setSearch] = useState("");
  const { data: leads = [] } = useQuery({
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

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(search.toLowerCase()) ||
    (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
    (lead.phone && lead.phone.includes(search))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredLeads.map((lead) => (
            <ChatContact key={lead.id} lead={lead} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
