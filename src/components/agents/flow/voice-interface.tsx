
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInterfaceProps {
  agentId: string;
}

export function VoiceInterface({ agentId }: VoiceInterfaceProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'response.audio.done') {
      setIsSpeaking(false);
    }
  };

  const startConversation = async () => {
    try {
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setIsConnected(true);
      
      toast({
        title: "Connected",
        description: "Voice interface is ready",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: "destructive",
      });
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {!isConnected ? (
        <Button 
          onClick={startConversation}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Mic className="h-4 w-4 mr-2" />
          Start Conversation
        </Button>
      ) : (
        <Button 
          onClick={endConversation}
          variant="secondary"
          className={isSpeaking ? "animate-pulse" : ""}
        >
          <MicOff className="h-4 w-4 mr-2" />
          End Conversation
        </Button>
      )}
    </div>
  );
}
