
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, role, objective = "answer_calls", language = "en", voiceId } = await req.json();
    
    if (!name) {
      throw new Error('Agent name is required');
    }
    
    console.log(`Creating ElevenLabs agent: ${name}, role: ${role}`);
    
    // Check if API key is configured
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY environment variable is not set');
      throw new Error('ElevenLabs API key not configured');
    }
    
    // Map our role to a system prompt for ElevenLabs
    let systemPrompt = "You are a helpful AI assistant.";
    
    switch (role) {
      case "receptionist":
        systemPrompt = "You are a professional receptionist who helps callers with their inquiries.";
        break;
      case "sales_agent":
        systemPrompt = "You are a sales agent who helps customers find the right products and services.";
        break;
      case "customer_support":
        systemPrompt = "You are a customer support agent who helps customers resolve their issues.";
        break;
      case "technical_advisor":
        systemPrompt = "You are a technical advisor who helps customers with technical issues.";
        break;
      case "appointment_scheduler":
        systemPrompt = "You are an appointment scheduler who helps callers book appointments.";
        break;
      case "product_specialist":
        systemPrompt = "You are a product specialist who provides detailed information about products.";
        break;
      case "virtual_assistant":
        systemPrompt = "You are a virtual assistant who helps with various tasks and inquiries.";
        break;
    }
    
    // Add the objective to the system prompt if available
    if (objective) {
      systemPrompt += ` Your primary objective is to ${objective}.`;
    }

    // Create a new agent in ElevenLabs
    const response = await fetch(
      "https://api.elevenlabs.io/v1/convai/agents",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          name: name,
          description: `A ${role} agent created from the application`,
          avatar_url: null,
          system: systemPrompt,
          initial_message: `Hello, I'm ${name}. How can I help you today?`,
          knowledge_source: "none",
          model: "eleven_turbo_v2_5",
          voice_id: voiceId || "TxGEqnHWrfWFTfGW9XjX", // Default voice if none provided
          language: language,
          temperature: 0.7,
          enable_voice: true
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error (${response.status}):`, errorText);
      
      if (response.status === 401) {
        throw new Error('ElevenLabs API authentication failed: Invalid API key');
      } else {
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    
    if (!data.agent_id) {
      console.error('ElevenLabs API response missing agent_id:', data);
      throw new Error('Invalid response from ElevenLabs API');
    }
    
    console.log('Successfully created ElevenLabs agent with ID:', data.agent_id);
    
    return new Response(
      JSON.stringify({ 
        elevenlabsAgentId: data.agent_id,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating ElevenLabs agent:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        success: false
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
