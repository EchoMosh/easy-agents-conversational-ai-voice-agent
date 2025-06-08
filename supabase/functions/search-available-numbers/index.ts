import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
};

interface SearchNumbersRequest {
  workspaceId: string;
  areaCode?: string;
  country?: string;
  limit?: number;
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  monthlyPrice: number;
  areaCode: string;
  locality?: string;
  region?: string;
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
    const { workspaceId, areaCode, country = 'US', limit = 20 } = await req.json() as SearchNumbersRequest;

    // Verify user has access to this workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You do not have access to this workspace' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Phone number service not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build Twilio API URL for searching available phone numbers
    const twilioBaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/AvailablePhoneNumbers/${country}/Local.json`;
    const params = new URLSearchParams({
      PageSize: limit.toString(),
      VoiceEnabled: 'true',
    });

    // Add area code filter if provided
    if (areaCode) {
      params.append('AreaCode', areaCode);
    }

    const twilioUrl = `${twilioBaseUrl}?${params.toString()}`;

    // Make request to Twilio API
    const twilioResponse = await fetch(twilioUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/json',
      },
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio API error:', errorText);
      
      // Handle specific error cases
      if (twilioResponse.status === 400 && errorText.includes('area code')) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid area code',
            message: 'The area code you provided is not valid or has no available numbers'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to search phone numbers',
          message: 'Unable to retrieve available phone numbers at this time'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const twilioData = await twilioResponse.json();
    
    // Format the response
    const availableNumbers: AvailableNumber[] = twilioData.available_phone_numbers.map((number: any) => ({
      phoneNumber: number.phone_number,
      friendlyName: number.friendly_name,
      capabilities: {
        voice: number.capabilities.voice || false,
        sms: number.capabilities.sms || false,
        mms: number.capabilities.mms || false,
      },
      monthlyPrice: 1.00, // Platform absorbs the cost
      areaCode: number.phone_number.substring(2, 5), // Extract area code from +1AAANNNXXXX
      locality: number.locality,
      region: number.region,
    }));

    return new Response(
      JSON.stringify({ 
        success: true,
        numbers: availableNumbers,
        count: availableNumbers.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error searching available numbers:', error);
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
