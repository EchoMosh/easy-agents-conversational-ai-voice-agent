
import { Agent } from '@/types/agent-types';
import { toast } from '@/hooks/use-toast';

interface TrainingWebhookResponse {
  message: string;
  success: boolean;
  [key: string]: any; // Allow for additional fields in the response
}

interface SendUserMessageResponse {
  message: string;
  success: boolean;
  [key: string]: any;
}

/**
 * Initiates a training session by sending the agent flow data to the webhook
 */
export async function initiateTraining(agent: Agent): Promise<TrainingWebhookResponse> {
  try {
    console.log("[TrainingAPI] Sending agent flow data to webhook:", agent);
    
    const payload = {
      agent_id: agent.id,
      agent_name: agent.name,
      agent_role: agent.role,
      voice_id: agent.voice_id,
      flow: agent.flow,
      mermaid_chart: agent.mermaid_chart,
      language: agent.language || 'en-US',
      humor_level: agent.humor_level || 0
    };
    
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
      throw new Error(`Training webhook returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[TrainingAPI] Training webhook response:', data);
    
    return {
      message: data.message || 'Training session initiated successfully',
      success: true,
      ...data
    };
  } catch (error) {
    console.error('[TrainingAPI] Error initiating training:', error);
    toast({
      title: "Training Error",
      description: error instanceof Error ? error.message : "Failed to initiate training session",
      variant: "destructive",
    });
    
    return {
      message: 'Failed to initiate training session',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Sends a user message to the training webhook
 */
export async function sendUserMessage(agentId: string, message: string): Promise<SendUserMessageResponse> {
  try {
    console.log(`[TrainingAPI] Sending user message to webhook for agent ${agentId}:`, message);
    
    const payload = {
      agent_id: agentId,
      message,
      timestamp: new Date().toISOString()
    };
    
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
