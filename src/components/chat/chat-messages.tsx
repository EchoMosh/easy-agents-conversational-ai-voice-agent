
import { ReactNode, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useChatStore, { Message } from "@/hooks/use-chat-store";
import { Lead } from "@/pages/dashboard/leads";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  ChatMessageList,
} from "@/components/ui/shadcn-chat/chat-bubble";
import { Heart, Share, MoreVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessagesProps {
  lead: Lead;
}

export function ChatMessages({ lead }: ChatMessagesProps) {
  const { messages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for this lead
  const leadMessages = messages.filter((msg) => msg.leadId === lead.id);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [leadMessages.length]);

  // Get message type icon
  const getMessageTypeIcon = (type: "email" | "sms" | "note") => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "sms":
        return <Phone className="h-4 w-4 text-green-500" />;
      case "note":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
    }
  };

  // Get message variant based on whether it's from the user or the lead
  const getMessageVariant = (message: Message) => {
    // Assuming messages from the current user have userId defined
    // and messages from the lead don't have a userId
    return message.userId ? "sent" : "received";
  };

  if (leadMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No messages yet</h3>
        <p className="text-muted-foreground">
          Send your first message to {lead.name} using the composer below.
        </p>
      </div>
    );
  }

  const actionIcons = [
    { icon: <MoreVertical className="size-4" />, type: "More" },
    { icon: <Share className="size-4" />, type: "Share" },
    { icon: <Heart className="size-4" />, type: "Like" },
  ];

  return (
    <div className="h-full py-4">
      <ChatMessageList className="px-4">
        <AnimatePresence>
          {leadMessages.map((message, index) => {
            const variant = getMessageVariant(message);
            const typeIcon = getMessageTypeIcon(message.type);
            const initials = message.userName
              ? message.userName.charAt(0).toUpperCase()
              : lead.name.charAt(0).toUpperCase();
            const formattedDate = new Date(message.createdAt).toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit" }
            );

            return (
              <motion.div
                key={message.id}
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
                <ChatBubble variant={variant}>
                  <ChatBubbleAvatar
                    src={message.userAvatar}
                    fallback={initials}
                  />
                  <ChatBubbleMessage isLoading={message.isLoading}>
                    <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                      {typeIcon}
                      <span>
                        {message.type === "email"
                          ? "Email"
                          : message.type === "sms"
                          ? "SMS"
                          : "Note"}
                      </span>
                    </div>
                    {message.content}
                    {formattedDate && (
                      <ChatBubbleTimestamp timestamp={formattedDate} />
                    )}
                  </ChatBubbleMessage>
                  <ChatBubbleActionWrapper>
                    {actionIcons.map(({ icon, type }) => (
                      <ChatBubbleAction
                        className="size-7"
                        key={type}
                        icon={icon}
                        onClick={() =>
                          console.log(`${type} clicked for message ${message.id}`)
                        }
                      />
                    ))}
                  </ChatBubbleActionWrapper>
                </ChatBubble>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </ChatMessageList>
    </div>
  );
}
