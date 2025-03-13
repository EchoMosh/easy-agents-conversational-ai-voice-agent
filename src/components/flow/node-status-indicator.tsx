
import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const nodeStatusVariants = cva(
  "absolute inset-0 rounded-xl transition-all ease-in-out duration-300",
  {
    variants: {
      status: {
        idle: "border-2 border-gray-200 dark:border-gray-700",
        connected: "border-2 border-primary",
        processing: "border-2 border-orange-400 dark:border-orange-500",
        success: "border-2 border-green-500 dark:border-green-400",
        error: "border-2 border-rose-500 dark:border-rose-400",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        glow: "shadow-[0_0_8px_rgba(var(--primary-rgb),0.7)]",
      },
    },
    defaultVariants: {
      status: "idle",
      animation: "none",
    },
  }
);

export interface NodeStatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof nodeStatusVariants> {
  hasConnection?: boolean;
}

export function NodeStatusIndicator({
  className,
  children,
  status,
  animation,
  hasConnection = false,
  ...props
}: NodeStatusIndicatorProps) {
  // Automatically set the status based on connection state if not explicitly provided
  const connectionStatus = hasConnection ? "connected" : "idle";
  const effectiveStatus = status || connectionStatus;
  const effectiveAnimation = animation || (hasConnection ? "glow" : "none");

  return (
    <div className="relative group">
      <div
        className={cn(
          nodeStatusVariants({ status: effectiveStatus, animation: effectiveAnimation }),
          className
        )}
        {...props}
      />
      {children}
      
      {/* Connection status indicator */}
      {hasConnection && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
      )}
    </div>
  );
}
