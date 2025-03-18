import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import { Search, UserPlus, Filter, ChevronDown, X, Users2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
interface LeadSidebarProps {
  leads?: Lead[];
  selectedLeadId: string | null;
  onLeadSelect: (id: string) => void;
  className?: string;
}
export function LeadSidebar({
  leads = [],
  selectedLeadId,
  onLeadSelect,
  className
}: LeadSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Get unique statuses from leads
  const statuses = Array.from(new Set(leads.map(lead => lead.status).filter(Boolean))) as string[];
  useEffect(() => {
    // Check if any filters are active
    setHasActiveFilters(!!selectedStatus);
  }, [selectedStatus]);

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    // Search filter
    const matchesSearch = searchTerm === "" || lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || lead.phone && lead.phone.includes(searchTerm);

    // Status filter
    const matchesStatus = !selectedStatus || lead.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setSelectedStatus(null);
  };
  return <div className={`border-r flex flex-col bg-background min-w-[190px] ${className}`}>
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Users2 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Contacts</h2>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/15 text-xs px-1.5">
            {filteredLeads.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 pr-7 h-8 text-sm bg-muted/40 border-muted" />
          {searchTerm && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 hover:bg-transparent" onClick={() => setSearchTerm("")}>
              <X className="h-3 w-3" />
            </Button>}
        </div>
      </div>

      <div className="px-3 py-2 border-b">
        <div className="flex items-center gap-1.5">
          <Button variant={hasActiveFilters ? "default" : "outline"} size="sm" className="flex items-center gap-1 h-7 text-xs w-full justify-start bg-background border-muted">
            <Filter className="h-3 w-3" />
            <span>Filter</span>
            {hasActiveFilters && <Badge variant="secondary" className="ml-auto px-1 py-0 h-4 text-[10px]">
                {1}
              </Badge>}
            <ChevronDown className="h-3 w-3 ml-auto opacity-70" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {filteredLeads.length > 0 ? filteredLeads.map(lead => <button key={lead.id} onClick={() => onLeadSelect(lead.id)} className={cn("w-full flex items-center gap-2 p-2 rounded-lg transition-all", selectedLeadId === lead.id ? "bg-primary text-primary-foreground" : "hover:bg-muted/60 text-foreground")}>
                <Avatar className={cn("h-8 w-8", selectedLeadId === lead.id ? "border-2 border-primary-foreground" : "")}>
                  <AvatarFallback className={cn("text-xs font-medium", selectedLeadId === lead.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {lead.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-start gap-0.5 flex-1 text-left">
                  <h3 className="font-medium leading-none truncate max-w-[100px] text-base">{lead.name}</h3>
                  
                  {lead.email && <p className={cn("text-[10px] flex items-center gap-0.5", selectedLeadId === lead.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      <Mail className="h-2.5 w-2.5" />
                      <span className="truncate max-w-[90px] text-xs">{lead.email}</span>
                    </p>}
                  
                  {!lead.email && lead.phone && <p className={cn("text-[10px] flex items-center gap-0.5", selectedLeadId === lead.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      <Phone className="h-2.5 w-2.5" />
                      <span className="truncate max-w-[90px]">{lead.phone}</span>
                    </p>}
                </div>
              </button>) : <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users2 className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <h3 className="font-medium mb-1 text-sm">No matches</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {searchTerm || selectedStatus ? "Try changing filters" : "Add contacts"}
              </p>
              {(searchTerm || selectedStatus) && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                  <X className="mr-1.5 h-3 w-3" />
                  Clear
                </Button>}
            </div>}
        </div>
      </ScrollArea>
    </div>;
}