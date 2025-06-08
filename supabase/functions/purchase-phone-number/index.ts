import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
};

interface PurchaseNumberRequest {
  phoneNumber: string;
  workspaceId: string;
  friendlyName?: string;
  inboundAgentId?: string;
  outboundAgentId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { 
      phoneNumber, 
      workspaceId, 
      friendlyName, 
      inboundAgentId, 
      outboundAgentId 
    } = await req.json() as PurchaseNumberRequest;

    // Validate required fields
    if (!phoneNumber || !workspaceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phoneNumber and workspaceId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify user has admin access to this workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only workspace admins can purchase phone numbers' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const vapiApiKey = Deno.env.get('VAPI_API_KEY');

    if (!twilioAccountSid || !twilioAuthToken || !vapiApiKey) {
      console.error('Missing required credentials');
      return new Response(
        JSON.stringify({ error: 'Service not properly configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 1: Purchase the phone number from Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers.json`;
    
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        PhoneNumber: phoneNumber,
        FriendlyName: friendlyName || `Number for ${workspaceId}`,
        VoiceUrl: `https://api.vapi.ai/webhook/twilio/${twilioAccountSid}`, // VAPI webhook URL
        VoiceMethod: 'POST',
        VoiceFallbackUrl: `https://api.vapi.ai/webhook/twilio/${twilioAccountSid}/fallback`,
        VoiceFallbackMethod: 'POST',
        StatusCallbackUrl: `https://api.vapi.ai/webhook/twilio/${twilioAccountSid}/status`,
        StatusCallbackMethod: 'POST',
      }),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio purchase error:', errorText);
      
      // Handle specific error cases
      if (twilioResponse.status === 400 && errorText.includes('already purchased')) {
        return new Response(
          JSON.stringify({ 
            error: 'Phone number already purchased',
            message: 'This phone number has already been purchased'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to purchase phone number',
          message: 'Unable to purchase this phone number. It may no longer be available.'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const twilioData = await twilioResponse.json();
    const twilioSid = twilioData.sid;
    
    // Extract area code from phone number
    const areaCode = phoneNumber.substring(2, 5); // Extract from +1AAANNNXXXX

    // Step 2: Create phone number in VAPI
    let vapiPhoneNumberId = null;
    
    try {
      // If an inbound agent is specified, get its VAPI ID
      let assistantId = null;
      if (inboundAgentId) {
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('v_agent_id')
          .eq('id', inboundAgentId)
          .single();
        
        if (!agentError && agent?.v_agent_id) {
          assistantId = agent.v_agent_id;
        }
      }

      const vapiPayload = {
        provider: "twilio",
        number: phoneNumber,
        twilioAccountSid: twilioAccountSid,
        twilioAuthToken: twilioAuthToken,
        name: friendlyName || `Phone ${phoneNumber}`,
        ...(assistantId && { assistantId })
      };

      const vapiResponse = await fetch('https://api.vapi.ai/phone-number', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vapiPayload),
      });

      if (vapiResponse.ok) {
        const vapiData = await vapiResponse.json();
        vapiPhoneNumberId = vapiData.id;
      } else {
        console.error('VAPI phone number creation failed:', await vapiResponse.text());
        // Continue even if VAPI creation fails - we can retry later
      }
    } catch (vapiError) {
      console.error('VAPI error:', vapiError);
      // Continue even if VAPI creation fails
    }

    // Step 3: Save to database
    const { data: phoneNumberRecord, error: dbError } = await supabase
      .from('phone_numbers')
      .insert({
        workspace_id: workspaceId,
        twilio_phone_number: phoneNumber,
        twilio_sid: twilioSid,
        friendly_name: friendlyName || null,
        capabilities: {
          voice: true,
          sms: twilioData.capabilities?.sms || false,
          mms: twilioData.capabilities?.mms || false,
        },
        area_code: areaCode,
        country_code: 'US',
        monthly_cost: 1.00,
        status: 'active',
        inbound_agent_id: inboundAgentId || null,
        outbound_agent_id: outboundAgentId || null,
        vapi_phone_number_id: vapiPhoneNumberId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to release the number from Twilio if DB save fails
      try {
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers/${twilioSid}.json`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          },
        });
      } catch (releaseError) {
        console.error('Failed to release number after DB error:', releaseError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save phone number',
          message: 'The phone number was purchased but could not be saved. Please contact support.'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: phoneNumberRecord
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error purchasing phone number:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
