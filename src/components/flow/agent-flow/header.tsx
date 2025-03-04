
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, PhoneCall, Settings } from "lucide-react";
import { AgentSettings } from "@/components/agents/flow/agent-settings";
import { Agent } from "@/types/agent";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AgentTrainingPopup } from "@/components/agents/training/agent-training-popup";
import { VoiceCallDialog } from "@/components/agents/voice-call/voice-call-dialog";
import { CallOptionDialog } from "@/components/agents/voice-call/components/call-option-dialog";
import { useToast } from "@/hooks/use-toast";
import { FlowData, FlowNode } from "@/types/agent-types";
import { AIVoiceLoader } from "@/components/agents/ai-voice-loader";

interface HeaderProps {
  agent: Agent;
  onBack: () => void;
  onUpdateSettings: (settings: { voiceId?: string; language?: string; humorLevel?: number; maxDurationSeconds?: number }) => Promise<void>;
}

export function Header({ agent, onBack, onUpdateSettings }: HeaderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [showTrainingPopup, setShowTrainingPopup] = useState(false);
  const [showVoiceCallDialog, setShowVoiceCallDialog] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  const findFirstMessage = (flowData: FlowData): string => {
    if (!flowData || !flowData.nodes || !Array.isArray(flowData.nodes) || flowData.nodes.length === 0) {
      return "Hello, how can I help you today?"; // Default message if no nodes exist
    }

    // Look for greeting or speak nodes
    const greetingNodes = flowData.nodes.filter(
      (node: FlowNode) => node.type === 'greetingNode' || node.type === 'speakNode'
    );

    if (greetingNodes.length === 0) {
      return "Hello, how can I help you today?"; // Default message if no greeting/speak nodes
    }

    // Get the first greeting/speak node's message
    const firstNode = greetingNodes[0];
    if (firstNode.data) {
      // Check for message or greeting property
      if (firstNode.type === 'greetingNode' && firstNode.data.greeting) {
        return String(firstNode.data.greeting);
      } else if (firstNode.type === 'speakNode' && firstNode.data.message) {
        return String(firstNode.data.message);
      }
    }

    return "Hello, how can I help you today?"; // Default fallback
  };

  useEffect(() => {
    console.log('Setting up Supabase realtime connection...');
    
    // Subscribe to the real-time channel
    const channel = supabase.channel('agent-flow')
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync event received');
        setIsConnected(true);
      })
      .subscribe((status) => {
        console.log('Channel status changed:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    console.log('Channel created:', channel);

    // Log connection state changes
    const subscription = supabase.getChannels().forEach(channel => {
      console.log('Current channel state:', channel.state);
    });

    // Cleanup subscription
    return () => {
      console.log('Cleaning up Supabase channel...');
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get profile data if available
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          profile: profileData || {}
        });
        
        console.log('Current user data fetched:', profileData);
      }
    };
    
    fetchUserData();
  }, []);

  useEffect(() => {
    console.log('Connection status changed:', isConnected);
  }, [isConnected]);

  const handleUpdateAgent = async () => {
    if (isUpdatingAgent) return;
    
    setIsUpdatingAgent(true);
    try {
      console.log('Updating agent via webhook...');
      console.log('Agent data:', agent);
      
      const { data: fullAgentData, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agent.id)
        .single();
        
      if (agentError) {
        throw new Error(`Failed to fetch complete agent data: ${agentError.message}`);
      }
      
      let flowData: FlowData;
      if (typeof fullAgentData.flow === 'string') {
        try {
          flowData = JSON.parse(fullAgentData.flow);
        } catch (e) {
          console.error('Failed to parse flow data:', e);
          flowData = { nodes: [], edges: [] };
        }
      } else if (fullAgentData.flow) {
        flowData = (fullAgentData.flow as unknown) as FlowData;
      } else {
        flowData = { nodes: [], edges: [] };
      }
      
      const firstMessage = findFirstMessage(flowData);
      console.log('First message extracted from flow:', firstMessage);
      
      console.log('Voice ID from database:', fullAgentData.voice_id);
      console.log('Full agent data from database:', fullAgentData);
      
      const payload = {
        agentId: agent.id,
        agentName: agent.name,
        agentRole: agent.role,
        elevenlabsAgentId: agent.elevenlabs_agent_id || null,
        
        voiceId: fullAgentData.voice_id || "FGY2WhTYpPnrIDTdsKH5",
        
        language: fullAgentData.language || 'en',
        objective: fullAgentData.objective || '',
        humorLevel: fullAgentData.humor_level || 50,
        interactionType: fullAgentData.interaction_type || ['inbound'],
        knowledgeIds: fullAgentData.knowledge_ids || [],
        isActive: fullAgentData.is_active,
        mermaidChart: fullAgentData.mermaid_chart,
        
        firstMessage: firstMessage,
        
        user: currentUser ? {
          id: currentUser.id,
          email: currentUser.email,
          firstName: currentUser.profile?.first_name || '',
          lastName: currentUser.profile?.last_name || '',
          avatar: currentUser.profile?.avatar_url || '',
          businessType: currentUser.profile?.business_type || '',
          employeeCount: currentUser.profile?.employee_count || '',
          username: currentUser.profile?.username || ''
        } : null,
        
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending webhook payload (with firstMessage):', payload);
      
      const response = await fetch('https://moshi.app.n8n.cloud/webhook/update-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      let data;
      const responseText = await response.text();
      
      try {
        if (responseText && responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          throw new Error("Empty response from webhook");
        }
      } catch (parseError) {
        console.error('Error parsing webhook response:', parseError);
        console.error('Raw response text:', responseText);
        throw new Error("Failed to get a valid response from the webhook. The agent might not have been updated correctly.");
      }
      
      if (!data) {
        throw new Error("No data returned from webhook. The agent might not have been updated correctly.");
      }
      
      console.log('Webhook response:', data);
      
      toast({
        title: "Success",
        description: "Agent update request sent successfully",
      });
      
      // Show call options after successful update
      setShowCallOptions(true);
      
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update agent",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAgent(false);
    }
  };

  // Handle selecting desktop option
  const handleSelectDesktop = () => {
    setShowCallOptions(false);
    setShowVoiceCallDialog(true);
  };

  return (
    <>
      {isUpdatingAgent && <AIVoiceLoader />}
      
      <div className="relative h-16 w-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex items-center px-8 z-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-white/60 dark:from-gray-900/60 dark:via-gray-800/30 dark:to-gray-900/60 pointer-events-none" />
        
        <div className="flex items-center gap-6 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="hover:bg-gray-900/5 dark:hover:bg-white/5 transition-all duration-300 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </Button>
          <div className="flex flex-col">
            <h1 className="font-medium text-gray-900 dark:text-white">{agent.name}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{agent.role.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative ml-auto">
          <AgentSettings
            agentId={agent.id}
            currentVoice={agent.voice_id || undefined}
            currentLanguage={agent.language}
            onUpdateSettings={onUpdateSettings}
          >
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-gray-900/5 dark:hover:bg-white/5"
            >
              <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
          </AgentSettings>
          
          <Button 
            variant="secondary"
            className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 font-medium"
            onClick={handleUpdateAgent}
            disabled={isUpdatingAgent}
          >
            <PhoneCall className="h-4 w-4 mr-2" />
            {isUpdatingAgent ? "Processing..." : "Call Me"}
          </Button>
          
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all duration-300"
            onClick={() => setShowTrainingPopup(true)}
          >
            <Play className="h-4 w-4 mr-2" />
            Train Agent
          </Button>
        </div>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-16 right-8 z-50 p-3">
              <div 
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 shadow-lg ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isConnected ? 'Connected' : 'Disconnected'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AgentTrainingPopup 
        agent={agent} 
        open={showTrainingPopup} 
        onOpenChange={setShowTrainingPopup} 
      />
      
      <VoiceCallDialog
        agent={agent}
        open={showVoiceCallDialog}
        onOpenChange={setShowVoiceCallDialog}
      />
      
      <CallOptionDialog
        open={showCallOptions}
        onOpenChange={setShowCallOptions}
        onSelectDesktop={handleSelectDesktop}
      />
    </>
  );
}
