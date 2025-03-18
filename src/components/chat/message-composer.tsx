import { Mail, Phone, Send, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import useChatStore from "@/hooks/use-chat-store";
import { v4 as uuidv4 } from "uuid";

interface MessageComposerProps {
  messageType: "email" | "sms" | "note";
  onMessageTypeChange: (type: "email" | "sms" | "note") => void;
  leadId: string;
}

export function MessageComposer({
  messageType,
  onMessageTypeChange,
  leadId,
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { addMessage } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsLoading(true);

    try {
      // Get the current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      // First add a message to local state so UI updates immediately
      const newMessage = {
        id: uuidv4(),
        leadId,
        content: message,
        type: messageType,
        createdAt: new Date().toISOString(),
        userId: user.id,
        userName: user.email?.split("@")[0] || "User",
        userAvatar: user.user_metadata?.avatar_url,
      };

      addMessage(newMessage);

      // Then save to database based on message type
      if (messageType === "note") {
        const { error } = await supabase.from("lead_notes").insert({
          lead_id: leadId,
          content: message,
          user_id: user.id,
        });

        if (error) {
          console.error("Error adding note:", error);
          return;
        }
      } else if (messageType === "email") {
        // TODO: Implement email sending
        console.log("Sending email:", message);
        // Simulate a delay for email sending
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else if (messageType === "sms") {
        // TODO: Implement SMS sending
        console.log("Sending SMS:", message);
        // Simulate a delay for SMS sending
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Invalidate queries to ensure data is refreshed
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lead_notes", leadId] }),
        queryClient.invalidateQueries({
          queryKey: ["lead_activities", leadId],
        }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
      ]);

      // Clear the input
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t p-4">
      <form id="message-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <ToggleGroup
            type="single"
            value={messageType}
            onValueChange={(v) =>
              onMessageTypeChange(v as "email" | "sms" | "note")
            }
            className="justify-start"
          >
            <ToggleGroupItem value="email" aria-label="Email">
              <Mail className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="sms" aria-label="SMS">
              <Phone className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="note" aria-label="Note">
              <StickyNote className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="relative">
          <Textarea
            placeholder={
              messageType === "email"
                ? "Write your email..."
                : messageType === "sms"
                ? "Write your SMS..."
                : "Add a note..."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="resize-none min-h-[80px] pr-12"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute bottom-2 right-2"
            disabled={isLoading || !message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {messageType === "email" && (
            <p>
              Emails are sent with your company email as the sender address.
            </p>
          )}
          {messageType === "sms" && (
            <p>SMS messages will be sent from your company phone number.</p>
          )}
          {messageType === "note" && (
            <p>Notes are only visible internally and not sent to the lead.</p>
          )}
        </div>
      </form>
    </div>
  );
}
