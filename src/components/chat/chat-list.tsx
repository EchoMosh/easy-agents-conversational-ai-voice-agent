
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/pages/dashboard/leads";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatContact } from "./chat-contact";
import { Search, Users2, UserPlus, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

export function ChatList() {
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();
  
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
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Contacts</h2>
          </div>
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary hover:bg-primary/15 text-xs"
          >
            {filteredLeads.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 py-1.5 h-8 text-xs bg-muted/40 border-muted"
          />
        </div>
      </div>
      
      <div className="px-3 py-2 border-b flex items-center gap-2">
        {!isMobile ? (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 text-xs flex-1 justify-start bg-background border-muted"
            >
              <Filter className="h-3 w-3" />
              <span>Filter</span>
            </Button>
            
            <Button 
              size="sm"
              className="h-8 gap-1 text-xs flex-1"
            >
              <UserPlus className="h-3 w-3" />
              <span>New Contact</span>
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8 flex-1 bg-background border-muted"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
            
            <Button 
              size="icon"
              className="h-8 w-8 flex-1"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
      
      <ScrollArea className="flex-1 px-2">
        <div className="py-2 space-y-1">
          {filteredLeads.map((lead) => (
            <ChatContact key={lead.id} lead={lead} />
          ))}
          
          {filteredLeads.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No contacts match your search
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
