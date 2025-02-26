
import { Mail, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface MessageComposerProps {
  messageType: 'email' | 'sms';
  onMessageTypeChange: (type: 'email' | 'sms') => void;
}

export function MessageComposer({ messageType, onMessageTypeChange }: MessageComposerProps) {
  return (
    <div className="border-t p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <ToggleGroup 
            type="single" 
            value={messageType} 
            onValueChange={(v) => onMessageTypeChange(v as 'email' | 'sms')} 
            className="justify-start"
          >
            <ToggleGroupItem value="email" aria-label="Email">
              <Mail className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="sms" aria-label="SMS">
              <Phone className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button type="submit" form="message-form">
            <Send className="mr-2 h-4 w-4" />
            Send {messageType === 'email' ? 'Email' : 'SMS'}
          </Button>
        </div>
        {/* Message form will be implemented here */}
      </div>
    </div>
  );
}
