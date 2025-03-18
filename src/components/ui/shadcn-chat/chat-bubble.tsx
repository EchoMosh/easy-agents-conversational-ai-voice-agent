import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ChatBubbleProps {
  variant?: "sent" | "received";
  children: ReactNode;
  className?: string;
}

export function ChatBubble({
  variant = "sent",
  children,
  className,
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 w-max max-w-[85%]",
        variant === "sent" ? "ml-auto items-end" : "mr-auto items-start",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

export function ChatBubbleAvatar({
  src,
  fallback = "U",
  className,
}: ChatBubbleAvatarProps) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarImage src={src} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

interface ChatBubbleMessageProps {
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function ChatBubbleMessage({
  children,
  isLoading,
  className,
}: ChatBubbleMessageProps) {
  const bubble = (
    <div
      className={cn(
        "px-4 py-2.5 rounded-xl text-sm leading-relaxed",
        "bg-primary text-primary-foreground",
        "data-[variant=received]:bg-muted data-[variant=received]:text-muted-foreground",
        className
      )}
      data-variant={
        (children as any)?.props?.className?.includes("mr-auto")
          ? "received"
          : "sent"
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner className="size-4" />
          <span>Typing...</span>
        </div>
      ) : (
        children
      )}
    </div>
  );

  return bubble;
}

interface ChatBubbleTimestampProps {
  timestamp: string;
  className?: string;
}

export function ChatBubbleTimestamp({
  timestamp,
  className,
}: ChatBubbleTimestampProps) {
  return (
    <div
      className={cn(
        "text-xs text-muted-foreground mt-1 select-none",
        className
      )}
    >
      {timestamp}
    </div>
  );
}

interface ChatBubbleActionProps {
  icon: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ChatBubbleAction({
  icon,
  onClick,
  className,
}: ChatBubbleActionProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center p-1 rounded-full",
        "opacity-0 bg-background border shadow-sm group-hover:opacity-100 transition-opacity",
        "hover:bg-muted focus:opacity-100 focus:outline-none",
        className
      )}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export function ChatBubbleActionWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute -right-[10px] top-0 bottom-0 group flex flex-col gap-1 justify-center",
        "data-[variant=received]:left-0 data-[variant=received]:right-auto",
        className
      )}
      data-variant={
        (children as any)?.props?.className?.includes("mr-auto")
          ? "received"
          : "sent"
      }
    >
      {children}
    </div>
  );
}

interface ChatMessageListProps {
  children: ReactNode;
  className?: string;
}

export function ChatMessageList({ children, className }: ChatMessageListProps) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto px-4 py-4 space-y-4", className)}
    >
      {children}
    </div>
  );
}

export function useAutoScroll() {
  // This is just a placeholder for the actual implementation
  // from shadcn-chat. In a real implementation, we would add auto-scrolling logic
  return {
    scrollToBottom: () => {},
    isScrolledToBottom: true,
  };
}
