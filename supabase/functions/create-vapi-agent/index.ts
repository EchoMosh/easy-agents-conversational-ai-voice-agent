
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

  console.log('Function started - new request received');

  try {
    // Log the raw request body for debugging
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);
    
    // Parse the request body
    let requestData;
    try {
      requestData = JSON.parse(rawBody);
      console.log('Parsed request data:', JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid request format: Could not parse JSON');
    }
    
    const { name, role, objective = "answer_calls", language = "en", voiceId } = requestData;
    
    if (!name) {
      console.error('Missing required field: name');
      throw new Error('Agent name is required');
    }
    
    console.log(`Creating VAPI agent: ${name}, role: ${role}, language: ${language}`);
    
    // Check if API key is configured
    const apiKey = Deno.env.get('VAPI_API_KEY');
    if (!apiKey) {
      console.error('VAPI_API_KEY environment variable is not set');
      throw new Error('VAPI API key not configured');
    } else {
      console.log('VAPI_API_KEY is set and will be used for API calls');
    }
    
    // Map our role to a system prompt for VAPI
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
    
    // Create the payload for VAPI
    const payload = {
      voice: {
        provider: "11labs",
        voiceId: voiceId || "paul", // Default voice if none provided
        model: "eleven_flash_v2_5",
        useSpeakerBoost: true
      },
      transcriber: {
        provider: "assembly-ai"
      },
      firstMessageMode: "assistant-speaks-first",
      firstMessage: `Hello, I'm ${name}. How can I help you today?`,
      voicemailDetection: {
        provider: "twilio",
        enabled: true
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        systemPrompt: systemPrompt,
        emotionRecognitionEnabled: true
      },
      voicemailMessage: "I've reached your voicemail. I'll try to reach you again later.",
      endCallMessage: "Thank you for calling. Have a great day!"
    };
    
    console.log('Payload to be sent to VAPI API:', JSON.stringify(payload, null, 2));
    
    // Create a new agent in VAPI - using explicit string for the API key header
    console.log('Sending request to VAPI API...');
    let response;
    try {
      // Log header information (without the actual API key)
      console.log('Using Authorization header: Bearer [API_KEY_MASKED]');
      
      response = await fetch(
        "https://api.vapi.ai/assistant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        }
      );
      
      console.log(`VAPI API response status: ${response.status}`);
    } catch (fetchError) {
      console.error('Network error while fetching from VAPI API:', fetchError);
      throw new Error(`Network error connecting to VAPI API: ${fetchError.message}`);
    }

    const responseText = await response.text();
    console.log(`VAPI API response body: ${responseText}`);

    if (!response.ok) {
      console.error(`VAPI API error (${response.status}):`, responseText);
      throw new Error(`VAPI API error: ${response.status} - ${responseText}`);
    }

    // Parse the response JSON after checking it's valid
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response from VAPI:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to parse VAPI API response as JSON:', e);
      throw new Error('Invalid response format from VAPI API');
    }
    
    if (!data.id) {
      console.error('VAPI API response missing assistant ID:', data);
      throw new Error('Invalid response from VAPI API: Missing assistant ID');
    }
    
    console.log('Successfully created VAPI agent with ID:', data.id);
    
    const successResponse = {
      vapiAgentId: data.id,
      success: true
    };
    
    console.log('Returning success response:', JSON.stringify(successResponse));
    
    return new Response(
      JSON.stringify(successResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating VAPI agent:', error);
    console.error('Error stack:', error.stack);
    
    const errorResponse = { 
      error: error.message,
      details: error.stack,
      success: false
    };
    
    console.log('Returning error response:', JSON.stringify(errorResponse));
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
