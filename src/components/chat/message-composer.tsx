
import { 
  Mail, 
  Phone, 
  Send, 
  StickyNote, 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  ListOrdered, 
  List, 
  Smile, 
  Paperclip 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import useChatStore from "@/hooks/use-chat-store";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCC, setEmailCC] = useState("");
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
        metadata: messageType === "email" ? {
          subject: emailSubject,
          cc: emailCC,
        } : undefined
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
        console.log("Sending email:", message, "Subject:", emailSubject, "CC:", emailCC);
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
      if (messageType === "email") {
        setEmailSubject("");
        setEmailCC("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const insertFormatting = (format: string) => {
    // Simple implementation of formatting text insertion
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    
    let formattedText = '';
    
    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `_${selectedText}_`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText}`;
        break;
      case 'list-ordered':
        formattedText = `\n1. ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newText = message.substring(0, start) + formattedText + message.substring(end);
    setMessage(newText);
    
    // Set cursor position after formatting is applied
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
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

        {messageType === "email" && (
          <div className="space-y-2">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                type="text"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="cc">CC</Label>
              <Input
                id="cc"
                type="text"
                placeholder="email@example.com, another@example.com"
                value={emailCC}
                onChange={(e) => setEmailCC(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="flex items-center gap-1 border-b pb-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertFormatting('bold')}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertFormatting('italic')}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertFormatting('underline')}
              >
                <Underline className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertFormatting('link')}
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertFormatting('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => insertFormatting('list-ordered')}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

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
            rows={messageType === "email" ? 5 : 3}
            className={cn(
              "resize-none pr-12",
              messageType === "email" ? "min-h-[120px]" : "min-h-[80px]"
            )}
          />
          <div className="absolute bottom-2 right-2 flex items-center">
            {messageType === "email" && message.length > 0 && (
              <span className="text-xs text-muted-foreground mr-2">
                {message.length}/2000
              </span>
            )}
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !message.trim() || (messageType === "email" && !emailSubject.trim())}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
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
