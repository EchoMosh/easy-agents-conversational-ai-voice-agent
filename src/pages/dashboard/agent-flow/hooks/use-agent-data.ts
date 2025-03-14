
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/types/agent-types';
import { useEffect } from 'react';

export function useAgentData(id: string | undefined, navigate: ReturnType<typeof useNavigate>, toast: any) {
  const { data: agent, refetch, isError, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) throw new Error('No agent ID provided');
      
      console.log('[AgentFlowPage] Fetching agent data for ID:', id);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('[AgentFlowPage] Error fetching agent:', error);
        throw error;
      }
      if (!data) {
        console.error('[AgentFlowPage] Agent not found');
        throw new Error('Agent not found');
      }

      if (!data.v_agent_id) {
        console.error('[AgentFlowPage] Agent missing v_agent_id');
        throw new Error('Agent has not been properly initialized with n8n');
      }

      console.log('[AgentFlowPage] Agent data retrieved:', data);
      return data as Agent;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Agent Error",
        description: "This agent has not been properly initialized. Redirecting back to agents list.",
      });
      const timer = setTimeout(() => {
        navigate('/dashboard/agents');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isError, navigate, toast]);

  const handleUpdateSettings = async (settings: { voiceId?: string; language?: string; humorLevel?: number; maxDurationSeconds?: number }) => {
    if (!id) return;
    console.log('[AgentFlowPage] Updating agent settings:', settings);
    const { error } = await supabase
      .from('agents')
      .update(settings)
      .eq('id', id);
    
    if (error) {
      console.error('[AgentFlowPage] Error updating agent settings:', error);
      throw error;
    }
    console.log('[AgentFlowPage] Agent settings updated successfully');
  };

  return { agent, refetch, isError, isLoading, handleUpdateSettings };
}
