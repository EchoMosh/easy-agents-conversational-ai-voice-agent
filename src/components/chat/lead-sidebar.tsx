import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import { Search, Users, CheckCircle, Filter, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Contacts</h2>
          <Badge variant="outline" className="ml-auto">
            {filteredLeads.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-1 h-8"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 px-1 py-0 h-5">
                      {1}
                    </Badge>
                  )}
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
          </div>

          <Select defaultValue="newest">
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => onLeadSelect(lead.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-muted/60 ${
                  selectedLeadId === lead.id
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : ""
                }`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className={`text-sm ${
                      selectedLeadId === lead.id
                        ? "bg-primary/10 text-primary"
                        : "bg-muted"
                    }`}
                  >
                    {lead.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-left">
                  <h3 className="font-medium leading-none mb-1">{lead.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.email || lead.phone || "No contact info"}
                  </p>
                </div>

                {lead.status && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {lead.status}
                  </Badge>
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
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
