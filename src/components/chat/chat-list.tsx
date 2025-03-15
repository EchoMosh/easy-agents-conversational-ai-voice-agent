import * as React from "react";

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/pages/dashboard/leads";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatContact } from "./chat-contact";
import { Search } from "lucide-react";
import { useState } from "react";

interface ChatListProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChatList = React.forwardRef<HTMLDivElement, ChatListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-1 flex-col overflow-auto", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ChatList.displayName = "ChatList";

export { ChatList };
