import { Message, UserData } from "@/data/data";
import { cn } from "@/lib/utils";
import React, { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
} from "./ui/ui/chat/chat-bubble";
import { ChatMessageList } from "./ui/ui/chat/chat-message-list";
import { useAutoScroll } from "./ui/ui/chat/hooks/useAutoScroll";
import { DotsVerticalIcon, HeartIcon, Share1Icon } from "@radix-ui/react-icons";
import { Forward, Heart, Mail, MessageSquare } from "lucide-react";

interface ChatListProps {
  messages: Message[];
  selectedUser: UserData;
  sendMessage: (newMessage: Message) => void;
  isMobile: boolean;
}

const getMessageVariant = (messageName: string, selectedUserName: string) =>
  messageName !== selectedUserName ? "sent" : "received";

export function ChatList({
  messages,
  selectedUser,
  sendMessage,
  isMobile,
}: ChatListProps) {
  const actionIcons = [
    { icon: DotsVerticalIcon, type: "More" },
    { icon: Forward, type: "Like" },
    { icon: Heart, type: "Share" },
  ];

  // Determine if a message is SMS or Email based on the prefix
  const getMessageType = (message: string) => {
    if (message.startsWith('[Email]')) return 'email';
    if (message.startsWith('[SMS]')) return 'sms';
    return 'sms'; // Default
  };

  // Extract subject from email messages
  const getEmailSubject = (message: string) => {
    if (message.startsWith('[Email]')) {
      const subjectMatch = message.match(/\[Email\] Subject: (.*?)(?:\n|$)/);
      return subjectMatch ? subjectMatch[1] : "No Subject";
    }
    return null;
  };

  // Remove the type prefix and subject line for display
  const cleanMessage = (message: string) => {
    return message
      .replace(/^\[Email\] Subject: .*?\n/, '')
      .replace(/^\[SMS\]\s/, '');
  };

  return (
    <div className="w-full h-full overflow-hidden flex flex-col px-4 py-4">
      <ChatMessageList>
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="max-w-md p-8">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-muted rounded-full mb-4">
                  <HeartIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start a conversation with {selectedUser.name}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const variant = getMessageVariant(message.name, selectedUser.name);
              const messageType = getMessageType(message.message);
              const cleanedMessage = cleanMessage(message.message);
              
              return (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
                  transition={{
                    opacity: { duration: 0.1 },
                    layout: {
                      type: "spring",
                      bounce: 0.3,
                      duration: index * 0.05 + 0.2,
                    },
                  }}
                  style={{ originX: 0.5, originY: 0.5 }}
                  className="flex flex-col gap-2 p-4"
                >
                  {/* Message type indicator above the bubble */}
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-medium mb-1",
                    variant === "sent" ? "self-end" : "self-start",
                    messageType === 'email' ? 
                      variant === 'sent' ? "text-blue-600" : "text-blue-600" : 
                      variant === 'sent' ? "text-green-600" : "text-green-600"
                  )}>
                    {messageType === 'email' ? (
                      <><Mail size={12} /> Email</>
                    ) : (
                      <><MessageSquare size={12} /> SMS</>
                    )}
                  </div>
                  
                  {/* Show email subject if present */}
                  {messageType === 'email' && (
                    <div className={cn(
                      "text-xs font-medium mb-1 italic",
                      variant === "sent" ? "self-end text-right" : "self-start",
                      variant === 'sent' ? "text-blue-300" : "text-blue-500"
                    )}>
                      Subject: {getEmailSubject(message.message)}
                    </div>
                  )}
                  
                  {/* Usage of ChatBubble component */}
                  <ChatBubble variant={variant}>
                    <ChatBubbleAvatar src={message.avatar} />
                    <ChatBubbleMessage 
                      isLoading={message.isLoading}
                      className={cn(
                        messageType === 'email' ? 
                          variant === 'sent' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-900' : 
                          variant === 'sent' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-900'
                      )}
                    >
                      {cleanedMessage}
                      {message.timestamp && (
                        <ChatBubbleTimestamp timestamp={message.timestamp} />
                      )}
                    </ChatBubbleMessage>
                    <ChatBubbleActionWrapper>
                      {actionIcons.map(({ icon: Icon, type }) => (
                        <ChatBubbleAction
                          className="size-7"
                          key={type}
                          icon={<Icon className="size-4" />}
                          onClick={() =>
                            console.log(
                              "Action " + type + " clicked for message " + index,
                            )
                          }
                        />
                      ))}
                    </ChatBubbleActionWrapper>
                  </ChatBubble>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </ChatMessageList>
    </div>
  );
}
