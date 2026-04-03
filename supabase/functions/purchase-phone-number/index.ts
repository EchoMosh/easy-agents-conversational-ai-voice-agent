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

interface PurchaseRequest {
  workspaceId: string;
  mode: "vapi" | "twilio";
  phoneNumber?: string; // For twilio mode - the number to purchase
  friendlyName?: string;
  inboundAgentId?: string;
  outboundAgentId?: string;
  areaCode?: string;
  country?: string;
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

    const body = (await req.json()) as PurchaseRequest;
    const {
      workspaceId,
      mode = "vapi",
      phoneNumber: requestedNumber,
      friendlyName,
      inboundAgentId,
      outboundAgentId,
      areaCode,
      country,
    } = body;

    if (!workspaceId) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: workspaceId",
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify user has owner/admin access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (
      membershipError ||
      !membership ||
      !["admin", "owner"].includes(membership.role)
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Unauthorized: Only workspace owners can purchase phone numbers",
          success: false,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    if (!vapiApiKey) {
      return ok({
        error: "Voice service not properly configured",
        success: false,
      });
    }

    // Get assistant ID for inbound agent
    let assistantId: string | null = null;
    if (inboundAgentId) {
      const { data: agent } = await supabase
        .from("agents")
        .select("v_agent_id")
        .eq("id", inboundAgentId)
        .single();
      if (agent?.v_agent_id) {
        assistantId = agent.v_agent_id;
      }
    }

    let finalPhoneNumber = "";
    let vapiPhoneNumberId = "";
    let twilioSid = "";
    let monthlyCost = 0;
    let countryCode = country || "US";

    if (mode === "twilio") {
      // ---- TWILIO MODE: Buy number via user's Twilio, then import to VAPI ----

      // Get workspace's Twilio credentials
      const { data: integration } = await supabase
        .from("workspace_integrations")
        .select("account_sid, auth_token, is_connected")
        .eq("workspace_id", workspaceId)
        .eq("provider", "twilio")
        .single();

      if (
        !integration?.is_connected ||
        !integration.account_sid ||
        !integration.auth_token
      ) {
        return ok({
          error: "Twilio account not connected. Go to Settings to connect.",
          success: false,
        });
      }

      const { account_sid, auth_token } = integration;

      if (!requestedNumber) {
        return ok({
          error: "Phone number is required for purchase",
          success: false,
        });
      }

      // Step 1: Purchase on Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/IncomingPhoneNumbers.json`;
      const twilioBody = new URLSearchParams({
        PhoneNumber: requestedNumber,
        ...(friendlyName && { FriendlyName: friendlyName }),
      });

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${account_sid}:${auth_token}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: twilioBody.toString(),
      });

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        let message = "Failed to purchase number";
        try {
          const errorJson = JSON.parse(errorText);
          message = errorJson.message || message;
        } catch {}
        return ok({ error: message, success: false });
      }

      const twilioData = await twilioResponse.json();
      finalPhoneNumber = twilioData.phone_number;
      twilioSid = twilioData.sid;
      monthlyCost = 1.15;
      countryCode =
        requestedNumber.startsWith("+1") && requestedNumber.length === 12
          ? requestedNumber.substring(1, 2) === "1"
            ? "US"
            : "CA"
          : "US";

      // Step 2: Import into voice service
      const importPayload: Record<string, unknown> = {
        provider: "twilio",
        number: finalPhoneNumber,
        twilioAccountSid: account_sid,
        twilioAuthToken: auth_token,
        name: friendlyName || finalPhoneNumber,
        ...(assistantId && { assistantId }),
      };

      const importResponse = await fetch("https://api.vapi.ai/phone-number", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vapiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importPayload),
      });

      if (importResponse.ok) {
        const importData = await importResponse.json();
        vapiPhoneNumberId = importData.id || "";
      } else {
        console.error(
          "Failed to import number to voice service, continuing anyway",
        );
      }
    } else {
      // ---- VAPI MODE: Free virtual number ----
      const vapiPayload: Record<string, unknown> = {
        provider: "vapi",
        name: friendlyName || `Line ${workspaceId.slice(0, 8)}`,
        ...(assistantId && { assistantId }),
        ...(areaCode && { numberDesiredAreaCode: areaCode }),
      };

      const vapiResponse = await fetch("https://api.vapi.ai/phone-number", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vapiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vapiPayload),
      });

      if (!vapiResponse.ok) {
        const errorText = await vapiResponse.text();
        let parsedError = "Failed to provision number";
        try {
          const errorJson = JSON.parse(errorText);
          parsedError = errorJson.message || parsedError;
        } catch {}
        return ok({ error: parsedError, success: false });
      }

      const vapiData = await vapiResponse.json();
      finalPhoneNumber = vapiData.number || "";
      vapiPhoneNumberId = vapiData.id;
      monthlyCost = 0;
    }

    // Extract area code
    const extractedAreaCode =
      finalPhoneNumber.startsWith("+1") && finalPhoneNumber.length >= 5
        ? finalPhoneNumber.substring(2, 5)
        : areaCode || null;

    // Save to database
    const { data: phoneNumberRecord, error: dbError } = await supabase
      .from("phone_numbers")
      .insert({
        workspace_id: workspaceId,
        twilio_phone_number: finalPhoneNumber || null,
        twilio_sid: twilioSid || vapiPhoneNumberId || null,
        friendly_name: friendlyName || null,
        capabilities: { voice: true, sms: mode === "twilio", mms: false },
        area_code: extractedAreaCode,
        country_code: countryCode,
        monthly_cost: monthlyCost,
        status: "active",
        inbound_agent_id: inboundAgentId || null,
        outbound_agent_id: outboundAgentId || null,
        vapi_phone_number_id: vapiPhoneNumberId || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Cleanup: delete from VAPI if DB save fails
      if (vapiPhoneNumberId) {
        try {
          await fetch(`https://api.vapi.ai/phone-number/${vapiPhoneNumberId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${vapiApiKey}` },
          });
        } catch {}
      }
      return ok({
        error: "Failed to save phone number: " + dbError.message,
        success: false,
      });
    }

    return ok({ success: true, data: phoneNumberRecord });
  } catch (error) {
    console.error("Error purchasing phone number:", error);
    return ok({
      error: error.message || "Internal server error",
      success: false,
    });
  }
});
