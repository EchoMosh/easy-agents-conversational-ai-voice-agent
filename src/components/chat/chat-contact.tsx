
import { cn } from "@/lib/utils";
import { Lead } from "@/pages/dashboard/leads";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import { ChatPage } from "@/pages/dashboard/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow } from "date-fns";

// Function to get initials from full name
function getInitials(name: string): string {
  if (!name) return "?";

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
  if (!name) return "bg-gray-200 text-gray-600";

  // Pre-defined colors (tailwind-like)
  const colors = [
    "bg-gray-100 text-gray-800",
    "bg-red-100 text-red-800",
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-indigo-100 text-indigo-800",
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

function getLastMessageTime(date?: string): string {
  if (!date) return "";
  const messageDate = new Date(date);
  return formatDistanceToNow(messageDate, { addSuffix: false });
}

interface ChatContactProps {
  lead: Lead;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ChatContact({ lead, isSelected = false }: ChatContactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Generate mock message preview (would come from actual messages in a real app)
  const messagePreview = "This is a message preview...";
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left hover:bg-gray-50 dark:hover:bg-muted/70 border-b border-gray-100 dark:border-gray-800",
          isSelected && "bg-blue-50 dark:bg-blue-900/10"
        )}
      >
        <Avatar className="h-12 w-12 border border-transparent">
          <AvatarFallback
            className={cn(
              "text-base font-medium",
              getAvatarColor(lead.name)
            )}
          >
            {getInitials(lead.name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center w-full mb-1">
            <h3 className="font-medium text-gray-900 dark:text-foreground truncate">{lead.name}</h3>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {getLastMessageTime(lead.created_at) || "New"}
            </span>
          </div>
          
          <div className="flex items-start justify-between">
            <p className="text-sm text-gray-500 truncate">
              {lead.email || lead.phone || messagePreview}
            </p>
            
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 ml-2 mt-1"></div>
          </div>
        </div>
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="p-0 sm:max-w-md w-full">
          <ChatPage leadId={lead.id} />
        </SheetContent>
      </Sheet>
    </>
  );
}
