import { cn } from "@/lib/utils";
import { Lead } from "@/pages/dashboard/leads";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import { ChatPage } from "@/pages/dashboard/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Function to get initials from full name
function getInitials(name: string): string {
  if (!name) return "??";

  const nameParts = name.trim().split(/\s+/);

  if (nameParts.length === 1) {
    // If only one name, take first letter
    return nameParts[0].charAt(0).toUpperCase();
  } else {
    // Take first letter of first name and first letter of last name
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
}

// Generate consistent color based on name
function getAvatarColor(name: string): string {
  if (!name) return "bg-primary/10";

  // Pre-defined colors (tailwind-like)
  const colors = [
    "bg-red-100 text-red-800",
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-indigo-100 text-indigo-800",
    "bg-teal-100 text-teal-800",
    "bg-orange-100 text-orange-800",
  ];

  // Use name to generate a consistent index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Get positive hash value
  hash = Math.abs(hash);

  // Use modulo to get index within colors array
  return colors[hash % colors.length];
}

interface ChatContactProps {
  lead: Lead;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ChatContact({ lead }: ChatContactProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
          isOpen
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarFallback
              className={cn("text-xs font-medium", getAvatarColor(lead.name))}
            >
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500" />
        </div>
        <div className="flex flex-col items-start gap-1 overflow-hidden">
          <p className="truncate font-medium leading-none">{lead.name}</p>
          <p className="text-xs text-muted-foreground truncate w-full">
            {lead.email || lead.phone || "No contact info"}
          </p>
        </div>
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[400px] p-0">
          <ChatPage leadId={lead.id} />
        </SheetContent>
      </Sheet>
    </>
  );
}
