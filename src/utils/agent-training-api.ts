
import { Agent } from '@/types/agent-types';
import { useToast } from '@/hooks/use-toast';

interface SendUserMessageResponse {
  message: string;
  success: boolean;
  [key: string]: any;
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
