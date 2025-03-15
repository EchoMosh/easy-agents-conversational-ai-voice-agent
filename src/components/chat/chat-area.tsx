import { useState } from "react";
import { Lead } from "@/pages/dashboard/leads";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MoreHorizontal, Phone, Edit, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import shadcn-chat components
import { Chat } from "@/components/chat/chat";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  selectedLead: Lead | undefined;
  messageType: 'email' | 'sms' | 'note';
  onMessageTypeChange: (type: 'email' | 'sms' | 'note') => void;
}

// Mock messages
const DEMO_MESSAGES = [
  { id: 1, type: 'email', role: 'system', content: 'Hello! How can I help you today?', createdAt: new Date(Date.now() - 5400000) },
  { id: 2, type: 'email', role: 'user', content: 'Hi, I was wondering about your services.', createdAt: new Date(Date.now() - 5300000) },
  { id: 3, type: 'email', role: 'system', content: 'Of course! We offer a range of solutions tailored to your needs. What specific area are you interested in?', createdAt: new Date(Date.now() - 5200000) },
  { id: 4, type: 'email', role: 'user', content: 'I\'m looking for help with sales automation, particularly for my e-commerce business.', createdAt: new Date(Date.now() - 5100000) },
  { id: 5, type: 'note', role: 'system', content: 'Customer is interested in sales automation for e-commerce. Follow up with case studies.', createdAt: new Date(Date.now() - 3600000) },
  { id: 6, type: 'sms', role: 'system', content: 'Just following up on our conversation. Would you like to schedule a demo?', createdAt: new Date(Date.now() - 2100000) },
  { id: 7, type: 'sms', role: 'user', content: 'Yes, that would be great. How about Friday afternoon?', createdAt: new Date(Date.now() - 1500000) },
];

export function ChatArea({ 
  selectedLead, 
  messageType, 
  onMessageTypeChange 
}: ChatAreaProps) {
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!selectedLead) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background rounded-lg">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium text-foreground">No conversation selected</h3>
          <p className="text-muted-foreground text-sm">
            Select a lead from the sidebar to start a conversation or view lead details
          </p>
        </div>
      </div>
    );
  }

  // Filter messages by type
  const filteredMessages = messages.filter(m => m.type === messageType);

  const handleSend = (message: string) => {
    if (message.trim() === "") return;
    
    setIsLoading(true);
    
    // Add message to list
    const newMessage = {
      id: messages.length + 1,
      type: messageType,
      role: 'system',
      content: message,
      createdAt: new Date()
    };
    
    // Simulate API call delay
    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setInput("");
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex-1 border rounded-lg overflow-hidden bg-background">
      {/* Custom Chat Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-semibold">
                {selectedLead.name[0].toUpperCase()}
              </div>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium">{selectedLead.name}</h2>
                <Badge variant="outline" className="text-xs font-normal px-2 py-0 h-5">
                  {selectedLead.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {selectedLead.email ? (
                    <>
                      <Mail className="h-3 w-3" />
                      <span>{selectedLead.email}</span>
                    </>
                  ) : selectedLead.phone ? (
                    <>
                      <Phone className="h-3 w-3" />
                      <span>{selectedLead.phone}</span>
                    </>
                  ) : (
                    <span>No contact info</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Lead Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Lead</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Change Status</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Message Type Tabs */}
      <div className="border-b flex justify-center">
        <div className="flex space-x-1 p-1">
          <Button 
            variant={messageType === 'email' ? "default" : "ghost"} 
            size="sm"
            onClick={() => onMessageTypeChange('email')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button 
            variant={messageType === 'sms' ? "default" : "ghost"} 
            size="sm"
            onClick={() => onMessageTypeChange('sms')}
          >
            <Phone className="h-4 w-4 mr-2" />
            SMS
          </Button>
          <Button 
            variant={messageType === 'note' ? "default" : "ghost"} 
            size="sm"
            onClick={() => onMessageTypeChange('note')}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Notes
          </Button>
        </div>
      </div>

      {/* Chat Component */}
      <Chat className="h-[calc(100%-8rem)]">
        <ChatList className="p-4">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div className="max-w-md">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-muted rounded-full mb-4">
                  {messageType === 'email' ? <Mail className="h-4 w-4" /> : 
                   messageType === 'sms' ? <Phone className="h-4 w-4" /> : 
                   <RefreshCw className="h-4 w-4" />}
                </div>
                <h3 className="text-lg font-medium mb-2">No {messageType} messages yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {messageType === 'email' 
                    ? "Start an email thread with this lead" 
                    : messageType === 'sms' 
                    ? "Send an SMS to connect with this lead"
                    : "Add notes about this lead to keep track of important information"}
                </p>
              </div>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <ChatMessage 
                key={message.id} 
                className={cn(
                  message.type === 'note' && "bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-100 border border-amber-200 dark:border-amber-900"
                )}
                message={{
                  role: message.role,
                  content: message.content,
                  createdAt: message.createdAt
                }}
              />
            ))
          )}
        </ChatList>
        <ChatInput
          placeholder={
            messageType === 'email' 
              ? "Compose your email..." 
              : messageType === 'sms' 
              ? "Type your SMS message..." 
              : "Add a note about this lead..."
          }
          onSubmit={handleSend}
          isLoading={isLoading}
        />
      </Chat>
    </div>
  );
}
