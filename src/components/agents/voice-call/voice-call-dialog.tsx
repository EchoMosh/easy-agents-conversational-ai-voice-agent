
import { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Agent } from '@/types/agent-types';
import { CallStatus } from './components/call-status';
import { ConversationDisplay } from './components/conversation-display';
import { CallControls } from './components/call-controls';
import { useVoiceCall } from './hooks/use-voice-call';

interface VoiceCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

export function VoiceCallDialog({ open, onOpenChange, agent }: VoiceCallDialogProps) {
  const {
    isLoading,
    error,
    isSpeaking,
    isListening,
    isMuted,
    conversationText,
    toggleMute,
    handleRetry,
    cleanupConversation
  } = useVoiceCall(agent, open);

  // Handle dialog close
  const handleClose = useCallback(() => {
    cleanupConversation();
    onOpenChange(false);
  }, [cleanupConversation, onOpenChange]);

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
        
        <CallStatus 
          isLoading={isLoading} 
          error={error} 
          agentName={agent.name}
          onRetry={handleRetry}
          onClose={handleClose}
        />

        {!isLoading && !error && (
          <>
            <ConversationDisplay 
              messages={conversationText}
              isSpeaking={isSpeaking}
              isListening={isListening}
              agentName={agent.name}
            />
            
            <CallControls 
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onEnd={handleClose}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
