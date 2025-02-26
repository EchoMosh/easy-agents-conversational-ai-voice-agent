
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead } from "@/pages/dashboard/leads";
import { useNavigate, useParams } from "react-router-dom";

interface ChatContactProps {
  lead: Lead;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ChatContact({ lead }: ChatContactProps) {
  const navigate = useNavigate();
  const { leadId } = useParams();
  const isSelected = leadId === lead.id;

  return (
    <button
      onClick={() => navigate(`/dashboard/chat/${lead.id}`)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
        isSelected 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
        <MessageSquare className="h-4 w-4" />
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500" />
      </span>
      <div className="flex flex-col items-start gap-1 overflow-hidden">
        <p className="truncate font-medium leading-none">{lead.name}</p>
        <p className="text-xs text-muted-foreground truncate w-full">
          {lead.email || lead.phone || "No contact info"}
        </p>
      </div>
    </button>
  );
}
