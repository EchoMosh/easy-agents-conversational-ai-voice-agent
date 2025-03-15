import { Message, UserData } from "@/data/data";
import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React, { useEffect } from "react";
import useChatStore from "@/hooks/useChatStore";
import ChatBottombar from "./chat-bottombar";

interface ChatProps {
  messages?: Message[];
  selectedUser: UserData;
  isMobile: boolean;
}

export function Chat({ selectedUser, isMobile }: ChatProps) {
  const { messages: messagesState, setMessages } = useChatStore();

  // Update messages when selected user changes
  useEffect(() => {
    setMessages(() => selectedUser.messages || []);
  }, [selectedUser, setMessages]);

  const sendMessage = (newMessage: Message) => {
    useChatStore.setState((state) => ({
      messages: [...state.messages, newMessage],
    }));
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden rounded-md">
      <ChatTopbar selectedUser={selectedUser} />

      <div className="flex-1 overflow-hidden relative">
        <ChatList
          messages={messagesState}
          selectedUser={selectedUser}
          sendMessage={sendMessage}
          isMobile={isMobile}
        />
      </div>

      <ChatBottombar isMobile={isMobile} />
    </div>
  );
}
