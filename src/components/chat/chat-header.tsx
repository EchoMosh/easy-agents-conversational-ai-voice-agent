import * as React from "react";

import { cn } from "@/lib/utils";

interface ChatHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChatHeader = React.forwardRef<HTMLDivElement, ChatHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-14 items-center justify-between border-b bg-background px-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ChatHeader.displayName = "ChatHeader";

export { ChatHeader }; 