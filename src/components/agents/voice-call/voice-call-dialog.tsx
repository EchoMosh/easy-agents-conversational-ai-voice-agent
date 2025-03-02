
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Agent } from '@/types/agent-types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Dynamically import the ElevenLabs client to avoid SSR issues
const importConversation = () => import('@11labs/client').then(mod => mod.Conversation);

interface VoiceCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

// Interface for the agent data with the elevenlabs_agent_id field
interface AgentWithElevenLabsId extends Agent {
  elevenlabs_agent_id?: string;
}

export function VoiceCallDialog({ open, onOpenChange, agent }: VoiceCallDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationText, setConversationText] = useState<string[]>([]);
  const conversationRef = useRef<any>(null);
  const { toast } = useToast();

  // Fetch the full agent data including the ElevenLabs agent ID
  const fetchAgentData = useCallback(async (agentId: string) => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();
    
    if (error) {
      console.error("Error fetching agent data:", error);
      throw new Error("Failed to fetch agent data. Please try again later.");
    }
    
    return data as AgentWithElevenLabsId;
  }, []);

  // Initialize the conversation
  const initializeConversation = useCallback(async () => {
    if (!open) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Initializing voice call for agent:", agent.id);
      
      // Request microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        throw new Error("Microphone access denied. Please allow microphone access to use this feature.");
      }
      
      // Fetch full agent data to get ElevenLabs agent ID if available
      const agentData = await fetchAgentData(agent.id);
      console.log("Full agent data:", agentData);
      
      // Get signed URL from our backend
      const { data, error: urlError } = await supabase.functions.invoke('generate-agent-call', {
        body: { 
          agentId: agent.id,
          elevenLabsAgentId: agentData.elevenlabs_agent_id // Pass the ElevenLabs agent ID if available
        }
      });
      
      if (urlError) {
        console.error("Error from generate-agent-call function:", urlError);
        throw new Error("Failed to initialize voice call. Please try again later.");
      }
      
      if (!data?.signedUrl) {
        console.error("Missing signed URL in response:", data);
        throw new Error("Failed to generate communication URL. Please check if the agent is properly configured.");
      }
      
      // Dynamically import the Conversation module
      const Conversation = await importConversation();
      
      // Initialize the conversation
      const conversation = await Conversation.startSession({
        signedUrl: data.signedUrl,
        onMessage: (message: any) => {
          console.log("Message received:", message);
          if (message.type === 'text') {
            setConversationText(prev => [...prev, message.content]);
          }
        },
        onStatusChange: (prop: { status: any }) => {
          // Correctly handle the status object parameter
          console.log("Status changed:", prop.status);
        },
        onModeChange: (prop: { mode: any }) => {
          // Correctly handle the mode object parameter
          console.log("Mode changed:", prop.mode);
          if (prop.mode) {
            setIsSpeaking(prop.mode.is_speaking || false);
            setIsListening(prop.mode.is_listening || false);
          }
        },
        onError: (error: any) => {
          console.error("Conversation error:", error);
          setError("An error occurred during the conversation. Please try again.");
        }
      });
      
      conversationRef.current = conversation;
      setIsLoading(false);
      
      // Add welcome message
      setConversationText([`Connected to ${agent.name}`]);
      
    } catch (err) {
      console.error("Error initializing conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize voice call");
      setIsLoading(false);
    }
  }, [agent, open, fetchAgentData]);
  
  // Clean up the conversation when the dialog closes
  const cleanupConversation = useCallback(() => {
    if (conversationRef.current) {
      console.log("Ending conversation session");
      conversationRef.current.endSession().catch(console.error);
      conversationRef.current = null;
    }
  }, []);
  
  // Initialize conversation when dialog opens
  useEffect(() => {
    if (open) {
      initializeConversation();
    }
    
    return () => {
      cleanupConversation();
    };
  }, [open, initializeConversation, cleanupConversation]);
  
  // Handle mute/unmute
  const toggleMute = useCallback(() => {
    if (!conversationRef.current) return;
    
    try {
      // Set volume to 0 when muted, 1 when unmuted
      conversationRef.current.setVolume({ volume: isMuted ? 1 : 0 });
      setIsMuted(!isMuted);
    } catch (err) {
      console.error("Error toggling mute:", err);
      toast({
        title: "Error",
        description: "Failed to change audio settings",
        variant: "destructive",
      });
    }
  }, [isMuted, toast]);
  
  // Handle dialog close
  const handleClose = useCallback(() => {
    cleanupConversation();
    onOpenChange(false);
  }, [cleanupConversation, onOpenChange]);
  
  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    initializeConversation();
  }, [initializeConversation]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Call with {agent.name}</DialogTitle>
          {!isLoading && !error && (
            <DialogDescription>
              Speak naturally with the agent. You can ask questions or provide information.
            </DialogDescription>
          )}
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-center text-sm text-muted-foreground">
              Connecting to {agent.name}...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRetry} variant="outline">Retry</Button>
              <Button onClick={handleClose} variant="default">Close</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col space-y-2 p-4 h-64 overflow-y-auto bg-muted/30 rounded-md">
              {conversationText.map((text, i) => (
                <div key={i} className="text-sm p-2 rounded">
                  {text}
                </div>
              ))}
              
              <div className="flex items-center justify-center h-12">
                {isSpeaking && (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    {agent.name} is speaking...
                  </p>
                )}
                {isListening && !isSpeaking && (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Listening...
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-center space-x-4 p-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX /> : <Volume2 />}
              </Button>
              
              <Button 
                variant="destructive"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={handleClose}
              >
                <PhoneOff />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
