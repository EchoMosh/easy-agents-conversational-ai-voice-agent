
import { Mail, Phone, Send, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface MessageComposerProps {
  messageType: 'email' | 'sms' | 'note';
  onMessageTypeChange: (type: 'email' | 'sms' | 'note') => void;
  leadId: string;
}

export function MessageComposer({ messageType, onMessageTypeChange, leadId }: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (messageType === 'note') {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      const { error } = await supabase
        .from('lead_notes')
        .insert({
          lead_id: leadId,
          content: message,
          user_id: user.id
        });

      if (error) {
        console.error("Error adding note:", error);
        return;
      }

      // Refresh both the chat area and timeline data
      queryClient.invalidateQueries({ queryKey: ['lead_notes', leadId] });
    }
    
    // TODO: Implement email and SMS sending
    console.log("Sending:", messageType, message);
    setMessage("");
  };

  return (
    <div className="border-t p-6">
      <form id="message-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <ToggleGroup 
            type="single" 
            value={messageType} 
            onValueChange={(v) => onMessageTypeChange(v as 'email' | 'sms' | 'note')} 
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
          <Button type="submit">
            <Send className="mr-2 h-4 w-4" />
            {messageType === 'note' ? 'Add Note' : `Send ${messageType === 'email' ? 'Email' : 'SMS'}`}
          </Button>
        </div>
        
        <Textarea 
          placeholder={messageType === 'email' 
            ? "Write your email..." 
            : messageType === 'sms' 
            ? "Write your SMS..." 
            : "Add a note..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={messageType === 'email' ? 5 : 3}
          className="resize-none"
        />
      </form>
    </div>
  );
}
