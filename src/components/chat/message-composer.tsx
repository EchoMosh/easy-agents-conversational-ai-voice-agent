import { 
  Paperclip, 
  Mail, 
  Phone, 
  Send, 
  StickyNote, 
  Smile, 
  Mic, 
  Calendar,
  Image,
  Link as LinkIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  messageType: 'email' | 'sms' | 'note';
  onMessageTypeChange: (type: 'email' | 'sms' | 'note') => void;
  leadId: string;
}

export function MessageComposer({ messageType, onMessageTypeChange, leadId }: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
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

        // Invalidate both queries to ensure data is refreshed
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['lead_notes', leadId] }),
          queryClient.invalidateQueries({ queryKey: ['lead_activities', leadId] })
        ]);
      } else {
        // Simulate API delay for email/SMS sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Sending:", messageType, message);
      }
      
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Simple typing indicator logic
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
    }
  };

  // Get placeholder and button text based on message type
  const getPlaceholder = () => {
    switch(messageType) {
      case 'email':
        return "Compose your email...";
      case 'sms':
        return "Type your SMS message...";
      case 'note':
        return "Add a note about this lead...";
      default:
        return "Type your message...";
    }
  };

  const getButtonText = () => {
    if (isSending) return "Sending...";
    
    switch(messageType) {
      case 'email':
        return "Send Email";
      case 'sms':
        return "Send SMS";
      case 'note':
        return "Add Note";
      default:
        return "Send";
    }
  };

  // Different attachment options based on message type
  const renderAttachmentOptions = () => {
    if (messageType === 'note') {
      return (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <LinkIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Add link</p>
            </TooltipContent>
          </Tooltip>
        </>
      );
    }
    
    if (messageType === 'email') {
      return (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Attach file</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Image className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Add image</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Schedule email</p>
            </TooltipContent>
          </Tooltip>
        </>
      );
    }
    
    if (messageType === 'sms') {
      return (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Image className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Add image</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Mic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Voice message</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Schedule SMS</p>
            </TooltipContent>
          </Tooltip>
        </>
      );
    }
    
    return null;
  };

  return (
    <div className="p-4">
      <form id="message-form" onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea 
            placeholder={getPlaceholder()}
            value={message}
            onChange={handleChange}
            className={cn(
              "resize-none pb-14 bg-background rounded-lg focus-visible:ring-1 focus-visible:ring-offset-0",
              messageType === 'email' ? "min-h-[180px]" : "min-h-[120px]"
            )}
          />
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Smile className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Add emoji</p>
                </TooltipContent>
              </Tooltip>
              
              {renderAttachmentOptions()}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit" 
                  size="sm" 
                  className={cn(
                    "rounded-full px-4",
                    (!message.trim() || isSending) && "opacity-70"
                  )}
                  disabled={!message.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {getButtonText()}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </form>
    </div>
  );
}
