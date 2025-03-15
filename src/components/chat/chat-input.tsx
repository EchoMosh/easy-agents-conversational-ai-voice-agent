import * as React from "react";
import { useRef } from "react";
import { Loader2, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  placeholder?: string;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
}

const ChatInput = React.forwardRef<HTMLDivElement, ChatInputProps>(
  ({ className, placeholder = "Write a message...", onSubmit, isLoading = false, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!textareaRef.current) return;
      
      const value = textareaRef.current.value.trim();
      if (!value) return;

      onSubmit(value);
      textareaRef.current.value = "";
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!textareaRef.current) return;
        
        const value = textareaRef.current.value.trim();
        if (!value || isLoading) return;

        onSubmit(value);
        textareaRef.current.value = "";
      }
    };

    return (
      <div
        ref={ref}
        className={cn("border-t bg-background px-4 py-2", className)}
        {...props}
      >
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            className="min-h-10 max-h-40 flex-1 resize-none rounded-lg border border-input bg-background p-3"
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-10 w-10 shrink-0 rounded-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    );
  }
);
ChatInput.displayName = "ChatInput";

export { ChatInput }; 