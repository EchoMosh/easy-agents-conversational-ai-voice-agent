
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import { Search, UserPlus, Filter, ChevronDown, X, Users2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  className,
}: LeadSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Get unique statuses from leads
  const statuses = Array.from(
    new Set(leads.map((lead) => lead.status).filter(Boolean))
  ) as string[];

  useEffect(() => {
    // Check if any filters are active
    setHasActiveFilters(!!selectedStatus);
  }, [selectedStatus]);

  // Filter leads based on search and filters
  const filteredLeads = leads.filter((lead) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email &&
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm));

    // Status filter
    const matchesStatus = !selectedStatus || lead.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setSelectedStatus(null);
  };

  return (
    <div
      className={`border-r flex flex-col bg-background min-w-[250px] ${className}`}
    >
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 bg-muted/40 border-muted"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 hover:bg-transparent"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1.5 h-9 w-full justify-start bg-background border-muted"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-auto px-1.5 py-0 h-5">
                    {1}
                  </Badge>
                )}
                <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Select
                    value={selectedStatus || ""}
                    onValueChange={(value) =>
                      setSelectedStatus(value || null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                  <Button size="sm">Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            variant="outline" 
            size="sm"
            className="h-9 gap-1.5 flex-1 bg-background border-muted"
          >
            <UserPlus className="h-4 w-4" />
            <span>New</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => onLeadSelect(lead.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                  selectedLeadId === lead.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/60 text-foreground"
                )}
              >
                <Avatar className={cn("h-10 w-10", 
                  selectedLeadId === lead.id 
                    ? "border-2 border-primary-foreground" 
                    : ""
                )}>
                  <AvatarFallback
                    className={cn(
                      "text-sm font-medium",
                      selectedLeadId === lead.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {lead.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-start gap-0.5 flex-1 text-left">
                  <h3 className="font-medium leading-none">{lead.name}</h3>
                  
                  {lead.email && (
                    <p className={cn(
                      "text-xs flex items-center gap-1",
                      selectedLeadId === lead.id 
                        ? "text-primary-foreground/80" 
                        : "text-muted-foreground"
                    )}>
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{lead.email}</span>
                    </p>
                  )}
                  
                  {!lead.email && lead.phone && (
                    <p className={cn(
                      "text-xs flex items-center gap-1",
                      selectedLeadId === lead.id 
                        ? "text-primary-foreground/80" 
                        : "text-muted-foreground"
                    )}>
                      <Phone className="h-3 w-3" />
                      <span>{lead.phone}</span>
                    </p>
                  )}
                </div>

                {lead.status && (
                  <Badge 
                    variant={selectedLeadId === lead.id ? "secondary" : "outline"} 
                    className={cn(
                      "text-xs",
                      selectedLeadId === lead.id 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : ""
                    )}
                  >
                    {lead.status}
                  </Badge>
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users2 className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <h3 className="font-medium mb-1">No matching contacts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || selectedStatus
                  ? "Try changing your search or filters"
                  : "Add contacts to get started"}
              </p>
              {(searchTerm || selectedStatus) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
