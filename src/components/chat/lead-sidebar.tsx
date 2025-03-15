import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Mail, Phone, Filter, MoreHorizontal, Clock, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeadSidebarProps {
  leads?: Lead[];
  selectedLeadId: string | null;
  onLeadSelect: (id: string) => void;
}

// Some example recent activity to display in the UI
const RECENT_ACTIVITIES = [
  { id: 1, leadName: "John Smith", action: "Email sent", time: "2h ago" },
  { id: 2, leadName: "Sarah Johnson", action: "SMS received", time: "3h ago" },
  { id: 3, leadName: "Michael Doe", action: "Note added", time: "5h ago" },
];

export function LeadSidebar({ leads, selectedLeadId, onLeadSelect }: LeadSidebarProps) {
  // Group leads by status for better organization
  const groupedLeads = {
    active: leads?.filter(lead => lead.status === "Active" || lead.status === "Qualified") || [],
    new: leads?.filter(lead => lead.status === "New" || !lead.status) || [],
    other: leads?.filter(lead => lead.status !== "Active" && lead.status !== "Qualified" && lead.status !== "New" && lead.status) || []
  };

  return (
    <div className="w-[320px] border-r flex flex-col bg-background/95 shadow-sm">
      {/* Header */}
      <div className="p-3 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <span>Lead Conversations</span>
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" />
                <span>Add New Lead</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Filter className="mr-2 h-4 w-4" />
                <span>Filter Leads</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search leads..." 
            className="w-full pl-9 h-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-offset-0" 
          />
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="conversations" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-3 mt-3">
          <TabsTrigger value="conversations">Leads</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conversations" className="flex-1 flex flex-col data-[state=inactive]:hidden">
          <ScrollArea className="flex-1">
            {Object.entries(groupedLeads).map(([category, categoryLeads]) => 
              categoryLeads.length > 0 && (
                <div key={category} className="mb-1">
                  <div className="px-3 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {category === 'active' ? 'Active Leads' : 
                       category === 'new' ? 'New Leads' : 'Other Leads'}
                    </p>
                  </div>
                  
                  <div>
                    {categoryLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => onLeadSelect(lead.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 transition-all mb-0.5 mx-2 rounded-lg",
                          selectedLeadId === lead.id
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted/70"
                        )}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <div className={cn(
                            "flex h-full w-full items-center justify-center",
                            selectedLeadId === lead.id 
                              ? "bg-primary-foreground/20 text-primary-foreground" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {lead.name[0].toUpperCase()}
                          </div>
                        </Avatar>
                        
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h3 className="font-medium leading-none text-sm truncate">{lead.name}</h3>
                            <div className="flex items-center shrink-0">
                              <Badge 
                                variant={selectedLeadId === lead.id ? "outline" : "secondary"}
                                className="text-[10px] font-normal px-1.5 h-4 rounded-md"
                              >
                                {lead.status || "New"}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {lead.email ? (
                              <Mail className="h-3 w-3 shrink-0" />
                            ) : lead.phone ? (
                              <Phone className="h-3 w-3 shrink-0" />
                            ) : null}
                            <p className="text-xs truncate opacity-80">
                              {lead.email || lead.phone || "No contact info"}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            <p className="text-xs truncate opacity-80">
                              Last contact: 2 days ago
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="activity" className="flex-1 data-[state=inactive]:hidden">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {RECENT_ACTIVITIES.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-8 w-8 shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    {activity.action.includes("Email") ? (
                      <Mail className="h-4 w-4" />
                    ) : activity.action.includes("SMS") ? (
                      <Phone className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.leadName}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                    <p className="text-xs mt-1 text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
