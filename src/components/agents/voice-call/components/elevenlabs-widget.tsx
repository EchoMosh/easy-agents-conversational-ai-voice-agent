
import { useEffect, useRef } from 'react';
import { Agent } from '@/types/agent';
import { supabase } from '@/integrations/supabase/client';

interface ElevenLabsWidgetProps {
  agent: Agent;
  onError: (error: string) => void;
}

export function ElevenLabsWidget({ agent, onError }: ElevenLabsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        // Fetch the agent data to get the ElevenLabs agent ID if available
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('elevenlabs_agent_id')
          .eq('id', agent.id)
          .single();
        
        if (agentError) {
          throw new Error(`Failed to fetch agent data: ${agentError.message}`);
        }
        
        // Use the ElevenLabs agent ID if available, otherwise use our agent ID
        const elevenlabsAgentId = agentData.elevenlabs_agent_id || agent.id;
        
        // Get signed URL from our Supabase function
        const { data, error } = await supabase.functions.invoke('generate-agent-call', {
          body: { 
            agentId: agent.id,
            elevenLabsAgentId: elevenlabsAgentId
          }
        });
        
        if (error) {
          throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
        
        if (!data?.signedUrl) {
          throw new Error('No signed URL returned from the server');
        }
        
        // Create and append the ElevenLabs widget script
        if (containerRef.current && !scriptLoaded.current) {
          const script = document.createElement('script');
          script.src = 'https://cdn.elevenlabs.io/widget.js';
          script.setAttribute('data-conversation-url', data.signedUrl);
          
          // Clean up any existing scripts
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(script);
          scriptLoaded.current = true;
        }
      } catch (err) {
        console.error('Error loading ElevenLabs widget:', err);
        onError(err instanceof Error ? err.message : 'Failed to load voice call widget');
      }
    };
    
    fetchSignedUrl();
    
    return () => {
      // Clean up on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, [agent, onError]);

  return (
    <div className="w-full h-[400px] bg-background rounded-lg border border-border" ref={containerRef}>
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-primary/20 mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  );
}
