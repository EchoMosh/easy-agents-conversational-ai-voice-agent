import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
};

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization header",
          success: false,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization", success: false }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { workspaceId, country, areaCode, limit } = await req.json();

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: "Missing workspaceId", success: false }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", success: false }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get workspace's Twilio credentials
    const { data: integration } = await supabase
      .from("workspace_integrations")
      .select("account_sid, auth_token, is_connected")
      .eq("workspace_id", workspaceId)
      .eq("provider", "twilio")
      .single();

    if (
      !integration ||
      !integration.is_connected ||
      !integration.account_sid ||
      !integration.auth_token
    ) {
      return ok({
        error:
          "Twilio account not connected. Go to Settings to connect your Twilio account.",
        success: false,
      });
    }

    const { account_sid, auth_token } = integration;
    const searchCountry = country || "US";
    const searchLimit = Math.min(limit || 20, 20);

    // Build Twilio search URL
    let url = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/AvailablePhoneNumbers/${searchCountry}/Local.json?PageSize=${searchLimit}`;
    if (areaCode) {
      url += `&AreaCode=${areaCode}`;
    }

    const twilioResponse = await fetch(url, {
      headers: {
        Authorization: "Basic " + btoa(`${account_sid}:${auth_token}`),
      },
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error("Twilio search error:", errorText);
      let message = "Failed to search for available numbers";
      try {
        const errorJson = JSON.parse(errorText);
        message = errorJson.message || message;
      } catch {}
      return ok({ error: message, success: false });
    }

    const twilioData = await twilioResponse.json();
    const numbers = (twilioData.available_phone_numbers || []).map(
      (num: any) => ({
        phoneNumber: num.phone_number,
        friendlyName: num.friendly_name,
        locality: num.locality || "",
        region: num.region || "",
        capabilities: {
          voice: num.capabilities?.voice ?? true,
          sms: num.capabilities?.SMS ?? false,
          mms: num.capabilities?.MMS ?? false,
        },
      }),
    );

    return ok({ success: true, numbers, count: numbers.length });
  } catch (error) {
    console.error("Error searching numbers:", error);
    return ok({ error: error.message, success: false });
  }
});
