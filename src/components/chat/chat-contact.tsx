
import { cn } from "@/lib/utils";
import { Lead } from "@/pages/dashboard/leads";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import { ChatPage } from "@/pages/dashboard/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";

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
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm hover:bg-muted/70",
          isOpen
            ? "bg-primary text-primary-foreground"
            : "text-foreground"
        )}
      >
        <div className="relative">
          <Avatar className="h-10 w-10 border border-transparent">
            <AvatarFallback
              className={cn(
                "text-sm font-medium",
                isOpen
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : getAvatarColor(lead.name)
              )}
            >
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
        </div>
        
        <div className="flex flex-col items-start gap-0.5 overflow-hidden">
          <div className="flex justify-between items-center w-full">
            <p className="font-medium leading-none">{lead.name}</p>
            {lead.status && (
              <Badge variant={isOpen ? "secondary" : "outline"} className="text-xs ml-2">
                {lead.status}
              </Badge>
            )}
          </div>
          
          {lead.email && (
            <p className={cn(
              "text-xs flex items-center gap-1",
              isOpen ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{lead.email}</span>
            </p>
          )}
          
          {!lead.email && lead.phone && (
            <p className={cn(
              "text-xs flex items-center gap-1",
              isOpen ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              <Phone className="h-3 w-3" />
              <span>{lead.phone}</span>
            </p>
          )}
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
