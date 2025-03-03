
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import { Search } from "lucide-react";

interface LeadSidebarProps {
  leads?: Lead[];
  selectedLeadId: string | null;
  onLeadSelect: (id: string) => void;
}

export function LeadSidebar({ leads, selectedLeadId, onLeadSelect }: LeadSidebarProps) {
  return (
    <div className="w-80 border-r flex flex-col bg-[#f8f8f8]">
      <div className="p-4 border-b bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Search leads..." className="w-full pl-9 h-9 bg-gray-100 border-0" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {leads?.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onLeadSelect(lead.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-md transition-all ${
                selectedLeadId === lead.id
                  ? "bg-[#e6f7e6] text-green-600"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                selectedLeadId === lead.id ? "bg-green-400 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {lead.name[0].toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <h3 className={`font-medium leading-none mb-1 ${
                  selectedLeadId === lead.id ? "text-green-600" : "text-gray-700"
                }`}>{lead.name}</h3>
                <p className="text-xs text-gray-400 truncate">
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
