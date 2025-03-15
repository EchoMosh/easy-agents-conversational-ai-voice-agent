import React, { useEffect, useState } from "react";
import { Chat } from "@/components/shadcn-chat/chat";

// Import necessary data and types
import { userData, Message, UserData } from "@/data/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import useChatStore from "@/hooks/useChatStore";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ChatsPage() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkScreenWidth();

    // Event listener for screen width changes
    window.addEventListener("resize", checkScreenWidth);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  // Filter users based on search query
  const filteredUsers = userData.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex">
      {/* User selection sidebar */}
      <div className="w-72 border-r flex flex-col h-full bg-white dark:bg-gray-950 shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-3">Chats</h2>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                className={cn(
                  "flex items-center gap-3 w-full p-2 rounded-md transition-colors",
                  selectedUser.id === user.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                )}
                onClick={() => setSelectedUser(user)}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="text-left truncate flex-1 min-w-0">
                  <div className="font-medium truncate">{user.name}</div>
                  {user.messages && user.messages.length > 0 ? (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.messages[user.messages.length - 1].message || "New conversation"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No messages yet</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden border-l">
        <Chat
          selectedUser={selectedUser}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
