
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
export async function sendUserMessage(agentId: string, message: string, conversationHistory: {role: string, content: string}[] = []): Promise<SendUserMessageResponse> {
  try {
    console.log(`[TrainingAPI] Sending user message to webhook for agent ${agentId}:`, message);
    console.log(`[TrainingAPI] Including conversation history:`, conversationHistory);
    
    const payload = {
      agent_id: agentId,
      message,
      conversation_history: conversationHistory,
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
