import * as React from "react";

import { cn } from "@/lib/utils";

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {}

const Chat = React.forwardRef<HTMLDivElement, ChatProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-md border bg-background",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Chat.displayName = "Chat";

export { Chat }; 