import * as React from "react";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

type MessageRole = "system" | "user";

interface Message {
  role: MessageRole;
  content: string;
  createdAt?: Date;
}

interface ChatMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message: Message;
}

const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ className, message, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 py-4",
          message.role === "user" ? "justify-end" : "justify-start",
          className
        )}
        {...props}
      >
        {message.role !== "user" && (
          <Avatar className="h-9 w-9 border">
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-medium">
              A
            </div>
          </Avatar>
        )}
        <div
          className={cn(
            "max-w-[65%] rounded-lg px-4 py-3",
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          {message.createdAt && (
            <div className="mt-1 text-xs opacity-70">
              {formatDistanceToNow(message.createdAt, {
                addSuffix: true,
              })}
            </div>
          )}
        </div>
        {message.role === "user" && (
          <Avatar className="h-9 w-9 border">
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-medium">
              U
            </div>
          </Avatar>
        )}
      </div>
    );
  }
);
ChatMessage.displayName = "ChatMessage";

export { ChatMessage }; 