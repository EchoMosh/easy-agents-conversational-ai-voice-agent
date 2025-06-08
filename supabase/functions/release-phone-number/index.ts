import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
};

interface ReleasePhoneNumberRequest {
  phoneNumberId: string;
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
    const { phoneNumberId } = await req.json() as ReleasePhoneNumberRequest;

    // Validate required fields
    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: phoneNumberId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the phone number record to verify ownership
    const { data: phoneNumber, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('id', phoneNumberId)
      .single();

    if (phoneError || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if already released
    if (phoneNumber.status === 'released') {
      return new Response(
        JSON.stringify({ error: 'Phone number already released' }),
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
      .eq('workspace_id', phoneNumber.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only workspace admins can release phone numbers' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const vapiApiKey = Deno.env.get('VAPI_API_KEY');

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Service not properly configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 1: Delete from VAPI if exists
    if (phoneNumber.vapi_phone_number_id && vapiApiKey) {
      try {
        const vapiResponse = await fetch(`https://api.vapi.ai/phone-number/${phoneNumber.vapi_phone_number_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vapiApiKey}`,
          },
        });

        if (!vapiResponse.ok && vapiResponse.status !== 404) {
          console.error('Failed to delete VAPI phone number:', await vapiResponse.text());
          // Continue with release process even if VAPI deletion fails
        }
      } catch (vapiError) {
        console.error('VAPI deletion error:', vapiError);
        // Continue with release process
      }
    }

    // Step 2: Release from Twilio
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers/${phoneNumber.twilio_sid}.json`;
      
      const twilioResponse = await fetch(twilioUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        },
      });

      if (!twilioResponse.ok && twilioResponse.status !== 404) {
        const errorText = await twilioResponse.text();
        console.error('Twilio release error:', errorText);
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to release phone number',
            message: 'Unable to release the phone number from Twilio'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (twilioError) {
      console.error('Twilio release error:', twilioError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to release phone number',
          message: 'Network error while releasing phone number'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: Update database status to 'released'
    const { data: updatedPhoneNumber, error: updateError } = await supabase
      .from('phone_numbers')
      .update({
        status: 'released',
        inbound_agent_id: null,
        outbound_agent_id: null,
        vapi_phone_number_id: null,
      })
      .eq('id', phoneNumberId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update phone number status',
          message: 'The phone number was released but the database update failed'
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
        data: updatedPhoneNumber,
        message: 'Phone number successfully released'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error releasing phone number:', error);
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
