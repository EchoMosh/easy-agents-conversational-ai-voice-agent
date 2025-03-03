
import { Agent } from '@/types/agent-types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SendUserMessageResponse {
  message: string;
  success: boolean;
  [key: string]: any;
}

/**
 * Sends a user message to the training webhook
 */
export async function sendUserMessage(
  agentId: string, 
  message: string, 
  conversationHistory: {role: string, content: string}[] = []
): Promise<SendUserMessageResponse> {
  try {
    console.log(`[TrainingAPI] Sending user message to webhook for agent ${agentId}:`, message);
    console.log(`[TrainingAPI] Including conversation history:`, conversationHistory);
    
    // Fetch full agent data to include in the webhook
    const { data: fullAgentData, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();
      
    if (agentError) {
      console.error('[TrainingAPI] Error fetching agent data:', agentError);
      throw new Error(`Failed to fetch agent data: ${agentError.message}`);
    }
    
    console.log('[TrainingAPI] Retrieved agent data:', fullAgentData);
    
    // Create enhanced payload with more agent information
    const payload = {
      agent_id: agentId,
      message,
      conversation_history: conversationHistory,
      timestamp: new Date().toISOString(),
      
      // Include additional agent information
      agent_details: {
        name: fullAgentData.name,
        role: fullAgentData.role,
        objective: fullAgentData.objective,
        language: fullAgentData.language,
        humor_level: fullAgentData.humor_level,
        interaction_type: fullAgentData.interaction_type,
        knowledge_ids: fullAgentData.knowledge_ids,
        elevenlabs_agent_id: fullAgentData.elevenlabs_agent_id,
        voice_id: fullAgentData.voice_id,
        mermaid_chart: fullAgentData.mermaid_chart
      }
    };
    
    console.log('[TrainingAPI] Enhanced webhook payload:', payload);
    
    const response = await fetch('https://moshi.app.n8n.cloud/webhook/train-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TrainingAPI] Webhook error:', errorText);
      throw new Error(`Message webhook returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[TrainingAPI] Message webhook response:', data);
    
    // Handle the new response format with "output" field
    if (Array.isArray(data) && data.length > 0 && data[0].output) {
      return {
        message: data[0].output.trim(),
        success: true
      };
    }
    
    return {
      message: data.message || 'Default response message',
      success: true,
      ...data
    };
  } catch (error) {
    console.error('[TrainingAPI] Error sending user message:', error);
    
    return {
      message: 'Error processing your message. Please try again later.',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
