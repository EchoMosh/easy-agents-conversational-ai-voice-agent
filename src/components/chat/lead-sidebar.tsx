
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";

interface LeadSidebarProps {
  leads?: Lead[];
  selectedLeadId: string | null;
  onLeadSelect: (id: string) => void;
}

export function LeadSidebar({ leads, selectedLeadId, onLeadSelect }: LeadSidebarProps) {
  return (
    <div className="w-80 border-r flex flex-col bg-muted/10">
      <div className="p-4 border-b bg-background">
        <Input placeholder="Search leads..." className="w-full" />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {leads?.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onLeadSelect(lead.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedLeadId === lead.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                selectedLeadId === lead.id ? "bg-primary-foreground/20" : "bg-muted"
              }`}>
                {lead.name[0].toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium leading-none mb-1">{lead.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {lead.email || lead.phone || "No contact info"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
