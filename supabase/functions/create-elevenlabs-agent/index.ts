
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
    // Log request details
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Log the raw request body for debugging
    const rawBody = await req.text();
    console.log('Raw request body (length):', rawBody.length);
    console.log('Raw request body sample:', rawBody.substring(0, 500) + (rawBody.length > 500 ? '...' : ''));
    
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
    
    console.log(`Creating ElevenLabs agent: ${name}, role: ${role}, language: ${language}`);
    
    // Check if API key is configured
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY environment variable is not set');
      throw new Error('ElevenLabs API key not configured');
    } else {
      console.log('ELEVENLABS_API_KEY is set (masked for security)');
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
    
    // Create the payload, removing any fields that might cause issues
    const payload = {
      name: name,
      description: `A ${role} agent created from the application`,
      system: systemPrompt,
      initial_message: `Hello, I'm ${name}. How can I help you today?`,
      model: "eleven_turbo_v2_5",
      voice_id: voiceId || "TxGEqnHWrfWFTfGW9XjX", // Default voice if none provided
      language: language,
      temperature: 0.7,
      enable_voice: true
    };
    
    console.log('Payload to be sent to ElevenLabs API:', JSON.stringify(payload, null, 2));
    console.log('Using ElevenLabs API endpoint: https://api.elevenlabs.io/v1/convai/agents/create-agent');

    // Create a new agent in ElevenLabs with the correct endpoint
    console.log('Sending request to ElevenLabs API at:', new Date().toISOString());
    let response;
    try {
      const fetchStartTime = Date.now();
      response = await fetch(
        "https://api.elevenlabs.io/v1/convai/agents/create-agent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify(payload),
        }
      );
      
      const fetchEndTime = Date.now();
      console.log(`ElevenLabs API response received in ${fetchEndTime - fetchStartTime}ms`);
      console.log(`ElevenLabs API response status: ${response.status}`);
      console.log('ElevenLabs API response headers:', Object.fromEntries(response.headers.entries()));
    } catch (fetchError) {
      console.error('Network error while fetching from ElevenLabs API:', fetchError);
      console.error('Error name:', fetchError.name);
      console.error('Error message:', fetchError.message);
      throw new Error(`Network error connecting to ElevenLabs API: ${fetchError.message}`);
    }

    const responseText = await response.text();
    console.log(`ElevenLabs API response length: ${responseText.length}`);
    console.log(`ElevenLabs API response body sample: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);

    if (!response.ok) {
      console.error(`ElevenLabs API error (${response.status}):`, responseText);
      
      if (response.status === 401) {
        throw new Error('ElevenLabs API authentication failed: Invalid API key');
      } else if (response.status === 405) {
        throw new Error(`Method Not Allowed: The API endpoint does not support this method. Please check the API documentation.`);
      } else {
        throw new Error(`ElevenLabs API error: ${response.status} - ${responseText}`);
      }
    }

    // Parse the response JSON after checking it's valid
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response from ElevenLabs:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to parse ElevenLabs API response as JSON:', e);
      console.error('Response text causing parse error:', responseText);
      throw new Error('Invalid response format from ElevenLabs API');
    }
    
    if (!data.agent_id) {
      console.error('ElevenLabs API response missing agent_id:', data);
      throw new Error('Invalid response from ElevenLabs API: Missing agent_id');
    }
    
    console.log('Successfully created ElevenLabs agent with ID:', data.agent_id);
    
    const successResponse = {
      elevenlabsAgentId: data.agent_id,
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
    console.error('Error creating ElevenLabs agent:', error);
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
