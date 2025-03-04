
import { useEffect, useRef, useState } from 'react';
import { Agent } from '@/types/agent';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ElevenLabsWidgetProps {
  agent: Agent;
  onError: (error: string) => void;
}

export function ElevenLabsWidget({ agent, onError }: ElevenLabsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing ElevenLabs widget for agent:", agent.id);
        
        // Fetch the agent data to get the ElevenLabs agent ID if available
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('elevenlabs_agent_id')
          .eq('id', agent.id)
          .single();
        
        if (agentError) {
          console.error("Error fetching agent data:", agentError);
          throw new Error(`Failed to fetch agent data: ${agentError.message}`);
        }
        
        console.log("Agent data fetched:", agentData);
        
        // Use the ElevenLabs agent ID if available, otherwise use our agent ID
        const elevenlabsAgentId = agentData.elevenlabs_agent_id || null;
        console.log("Using ElevenLabs agent ID:", elevenlabsAgentId || 'not available');
        
        if (!elevenlabsAgentId) {
          throw new Error('No ElevenLabs agent ID available. Please ensure the agent is properly configured.');
        }
        
        // Get signed URL from our Supabase function
        console.log("Calling generate-agent-call function...");
        const { data, error } = await supabase.functions.invoke('generate-agent-call', {
          body: { 
            agentId: agent.id,
            elevenLabsAgentId: elevenlabsAgentId
          }
        });
        
        if (error) {
          console.error("Error from generate-agent-call function:", error);
          throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
        
        console.log("Function response:", data);
        
        if (!data?.signedUrl) {
          console.error("Missing signed URL in response:", data);
          throw new Error('No signed URL returned from the server. Please check if ElevenLabs API key is correctly configured.');
        }
        
        console.log("Signed URL obtained:", data.signedUrl);
        
        // Create and append the ElevenLabs widget script with the exact implementation
        if (containerRef.current && !scriptLoaded.current) {
          console.log("Creating ElevenLabs widget script...");
          
          // Clean up any existing content
          containerRef.current.innerHTML = '';
          
          const script = document.createElement('script');
          script.src = 'https://cdn.elevenlabs.io/widget.js';
          
          // Set required attribute with the signed URL
          script.setAttribute('data-conversation-url', data.signedUrl);
          
          // Optionally, customize the widget
          script.setAttribute('data-theme', 'light');
          script.setAttribute('data-title', `Speaking with ${agent.name}`);
          
          // Add event listeners to track script loading
          script.onload = () => {
            console.log("ElevenLabs widget script loaded successfully");
            setIsLoading(false);
            scriptLoaded.current = true;
          };
          
          script.onerror = (e) => {
            console.error("Error loading ElevenLabs widget script:", e);
            setError('Failed to load the voice call widget script. Please refresh and try again.');
            onError('Failed to load the voice call widget script');
            setIsLoading(false);
          };
          
          containerRef.current.appendChild(script);
        }
      } catch (err) {
        console.error('Error loading ElevenLabs widget:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load voice call widget';
        setError(errorMessage);
        onError(errorMessage);
        setIsLoading(false);
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
    <div className="w-full h-[400px] bg-background rounded-lg border border-border overflow-hidden" ref={containerRef}>
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-primary/20 mb-4"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2 text-destructive">Connection Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
