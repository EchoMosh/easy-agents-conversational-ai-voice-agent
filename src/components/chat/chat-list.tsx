
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/pages/dashboard/leads";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatContact } from "./chat-contact";
import { Search, Users2, UserPlus, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Contacts</h2>
          </div>
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary hover:bg-primary/15"
          >
            {filteredLeads.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40 border-muted"
          />
        </div>
      </div>
      
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-1.5 flex-1 justify-start bg-background border-muted"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filter</span>
        </Button>
        
        <Button 
          size="sm"
          className="h-9 gap-1.5 flex-1"
        >
          <UserPlus className="h-4 w-4" />
          <span>New Contact</span>
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredLeads.map((lead) => (
            <ChatContact key={lead.id} lead={lead} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
