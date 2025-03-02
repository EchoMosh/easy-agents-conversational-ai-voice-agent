
import { useState, useEffect } from 'react';

interface ConversationDisplayProps {
  messages: string[];
  isSpeaking: boolean;
  isListening: boolean;
  agentName: string;
}

export function ConversationDisplay({ 
  messages, 
  isSpeaking, 
  isListening, 
  agentName 
}: ConversationDisplayProps) {
  // Use state to handle automatic scrolling
  const [conversationRef, setConversationRef] = useState<HTMLDivElement | null>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (conversationRef) {
      conversationRef.scrollTop = conversationRef.scrollHeight;
    }
  }, [messages, conversationRef]);

  return (
    <div className="flex flex-col space-y-2 p-4 h-64 overflow-y-auto bg-muted/30 rounded-md" ref={setConversationRef}>
      {messages.map((text, i) => (
        <div key={i} className="text-sm p-2 rounded">
          {text}
        </div>
      ))}
      
      <div className="flex items-center justify-center h-12">
        {isSpeaking && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {agentName} is speaking...
          </p>
        )}
        {isListening && !isSpeaking && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Listening...
          </p>
        )}
      </div>
    </div>
  );
}
