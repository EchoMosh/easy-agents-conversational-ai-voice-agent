
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/pages/dashboard/leads";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatContact } from "./chat-contact";
import { Search, User, UserPlus, Filter, ChevronDown } from "lucide-react";
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
      // Add empty tags array to satisfy the Lead type
      return (data || []).map(lead => ({
        ...lead,
        tags: [] // Add empty tags array
      })) as Lead[];
    }
  });

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(search.toLowerCase()) ||
    (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
    (lead.phone && lead.phone.includes(search))
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-background">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Contacts</h2>
        </div>
        <Badge 
          variant="outline" 
          className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-1 rounded-full text-sm"
        >
          {filteredLeads.length}
        </Badge>
      </div>
      
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2 bg-gray-100 dark:bg-muted/40 border-none rounded-full"
          />
        </div>
      </div>
      
      <div className="px-4 pb-2 flex items-center gap-2">
        <Button 
          variant="outline" 
          className="flex-1 justify-between px-4 py-2 rounded-full bg-white dark:bg-background border-gray-200"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
        
        <Button 
          variant="outline"
          className="flex-1 justify-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-background border-gray-200"
        >
          <UserPlus className="h-4 w-4" />
          <span>New</span>
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="py-2">
          {filteredLeads.map((lead, index) => (
            <ChatContact 
              key={lead.id} 
              lead={lead} 
              isSelected={index === 0} 
            />
          ))}
          
          {filteredLeads.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500">
              No contacts match your search
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
