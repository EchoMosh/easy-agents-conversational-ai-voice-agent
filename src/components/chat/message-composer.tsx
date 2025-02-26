
import { Mail, Phone, Send, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface MessageComposerProps {
  messageType: 'email' | 'sms' | 'note';
  onMessageTypeChange: (type: 'email' | 'sms' | 'note') => void;
}

export function MessageComposer({ messageType, onMessageTypeChange }: MessageComposerProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement sending message/note
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
            Send {messageType === 'email' ? 'Email' : messageType === 'sms' ? 'SMS' : 'Note'}
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
