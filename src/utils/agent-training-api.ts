import { Agent } from "@/types/agent-types";
import { supabase } from "@/integrations/supabase/client";

interface SendUserMessageResponse {
  message: string;
  success: boolean;
  chatId?: string;
  [key: string]: any;
}

interface ConversationState {
  lastChatId?: string;
}

// Store conversation state per agent
const conversationStates = new Map<string, ConversationState>();

/**
 * Sends a user message to VAPI's chat API
 */
export async function sendUserMessage(
  agentId: string,
  message: string,
  conversationHistory: { role: string; content: string }[] = [],
  onProgress?: (chunk: string) => void,
): Promise<SendUserMessageResponse> {
  try {
    console.log(
      `[ChatAPI] Sending user message for agent ${agentId}:`,
      message,
    );

    // Fetch agent data to get the VAPI assistant ID
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .select("v_agent_id, name")
      .eq("id", agentId)
      .single();

    if (agentError) {
      console.error("[ChatAPI] Error fetching agent data:", agentError);
      throw new Error(`Failed to fetch agent data: ${agentError.message}`);
    }

    if (!agentData.v_agent_id) {
      throw new Error("Agent does not have a voice assistant ID configured");
    }

    console.log("[ChatAPI] Using assistant ID:", agentData.v_agent_id);

    // Get or create conversation state
    let conversationState = conversationStates.get(agentId);
    if (!conversationState) {
      conversationState = {};
      conversationStates.set(agentId, conversationState);
    }

    // Prepare chat request
    const requestBody: any = {
      assistantId: agentData.v_agent_id,
      input: message,
    };

    // Add previous chat ID for context if available
    if (conversationState.lastChatId) {
      requestBody.previousChatId = conversationState.lastChatId;
    }

    console.log("[ChatAPI] Chat request:", requestBody);

    const response = await fetch("https://api.vapi.ai/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ChatAPI] Chat API error:", errorText);
      throw new Error(
        `Chat API returned status ${response.status}: ${errorText}`,
      );
    }

    // Handle regular JSON response
    const chatResponse = await response.json();
    console.log("[ChatAPI] Chat response:", chatResponse);

    // Extract the chat ID for context
    const currentChatId = chatResponse.id;

    // Extract the assistant's response
    let fullResponse = "";
    if (chatResponse.output && chatResponse.output.length > 0) {
      fullResponse = chatResponse.output[0].content || "";
    }

    // Update conversation state with new chat ID
    if (currentChatId) {
      conversationState.lastChatId = currentChatId;
    }

    // Simulate typing effect if onProgress callback is provided
    if (onProgress && fullResponse) {
      console.log("[ChatAPI] Simulating typing effect for:", fullResponse);

      // Send characters one by one with a small delay
      for (let i = 0; i < fullResponse.length; i++) {
        setTimeout(() => {
          onProgress(fullResponse[i]);
        }, i * 30); // 30ms delay between characters
      }
    }

    console.log("[ChatAPI] Complete response received:", fullResponse);

    return {
      message: fullResponse.trim() || "No response received",
      success: true,
      chatId: currentChatId,
    };
  } catch (error) {
    console.error("[ChatAPI] Error sending user message:", error);

    return {
      message: "Error processing your message. Please try again later.",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Reset conversation context for an agent
 */
export function resetConversation(agentId: string): void {
  conversationStates.delete(agentId);
  console.log(`[ChatAPI] Reset conversation context for agent ${agentId}`);
}

/**
 * Get the current conversation state for an agent (for debugging)
 */
export function getConversationState(
  agentId: string,
): ConversationState | undefined {
  return conversationStates.get(agentId);
}
