
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

  console.log('Webhook relay function started - new request received');

  try {
    // Parse the request body
    const requestText = await req.text();
    let requestData;
    
    try {
      requestData = JSON.parse(requestText);
      console.log('Parsed request data:', JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid request format: Could not parse JSON');
    }
    
    // Get the webhook URL from env or request
    const webhookUrl = Deno.env.get('WEBHOOK_URL') || requestData.webhookUrl;
    
    if (!webhookUrl) {
      throw new Error('No webhook URL provided. Please set WEBHOOK_URL env variable or include webhookUrl in the request');
    }
    
    console.log(`Relaying webhook to: ${webhookUrl}`);
    
    // Forward the request to the actual webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData.payload || requestData),
    });
    
    // Log response details
    console.log(`Webhook response status: ${webhookResponse.status}`);
    
    // Get the webhook response
    const responseText = await webhookResponse.text();
    console.log(`Webhook response (length: ${responseText.length}):`, 
      responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    // Parse the response if it's JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log('Response is not JSON');
      responseData = { rawResponse: responseText };
    }
    
    return new Response(
      JSON.stringify({
        success: webhookResponse.ok,
        statusCode: webhookResponse.status,
        response: responseData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in webhook relay:', error);
    console.error('Error stack:', error.stack);
    
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
