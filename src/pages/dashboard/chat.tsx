import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { SendIcon, UserIcon } from "lucide-react";

// Sample messages for demonstration
const demoMessages = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! How can I help you today?",
    timestamp: new Date()
  }
];

interface ChatPageProps {
  leadId?: string;
}

export function ChatPage({ leadId }: ChatPageProps) {
  const [messages, setMessages] = React.useState(demoMessages);
  const [inputValue, setInputValue] = React.useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        content: inputValue,
        timestamp: new Date()
      }
    ]);

    // Reset input
    setInputValue("");

    // Simulate assistant reply
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "This is a simulated response. Chat functionality is coming soon!",
          timestamp: new Date()
        }
      ]);
    }, 1000);
  };

  return (
    <div className="flex h-full flex-col">
      <Card className="flex flex-col h-full border-0 rounded-none">
        <CardHeader className="border-b px-4 py-4">
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4">
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[80%] items-start gap-2 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      {message.role === "user" ? (
                        <UserIcon className="h-5 w-5" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-primary">AI</div>
                      )}
                    </Avatar>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p>{message.content}</p>
                      <span className="mt-1 text-xs opacity-50">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="border-t p-4">
          <form className="flex w-full gap-2" onSubmit={handleSendMessage}>
            <Input
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
