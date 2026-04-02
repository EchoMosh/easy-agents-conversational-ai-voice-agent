import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
};

interface ReleasePhoneNumberRequest {
  phoneNumberId: string;
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
        JSON.stringify({ error: "Missing authorization header" }),
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
      return new Response(JSON.stringify({ error: "Invalid authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phoneNumberId } = (await req.json()) as ReleasePhoneNumberRequest;

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: phoneNumberId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get the phone number record
    const { data: phoneNumber, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("id", phoneNumberId)
      .single();

    if (phoneError || !phoneNumber) {
      return new Response(JSON.stringify({ error: "Phone number not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (phoneNumber.status === "released") {
      return new Response(
        JSON.stringify({ error: "Phone number already released" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify user has admin access to this workspace
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", phoneNumber.workspace_id)
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
            "Unauthorized: Only workspace admins can release phone numbers",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    if (!vapiApiKey) {
      console.error("Missing VAPI_API_KEY");
      return new Response(
        JSON.stringify({ error: "Service not properly configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Delete from VAPI
    const vapiId = phoneNumber.vapi_phone_number_id;
    if (vapiId) {
      try {
        const vapiResponse = await fetch(
          `https://api.vapi.ai/phone-number/${vapiId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${vapiApiKey}`,
            },
          },
        );

        if (!vapiResponse.ok && vapiResponse.status !== 404) {
          const errorText = await vapiResponse.text();
          console.error("VAPI delete error:", errorText);
          return new Response(
            JSON.stringify({
              error: "Failed to release phone number from VAPI",
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } catch (vapiError) {
        console.error("VAPI deletion network error:", vapiError);
        return new Response(
          JSON.stringify({
            error: "Network error while releasing phone number",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Update database status to 'released'
    const { data: updatedPhoneNumber, error: updateError } = await supabase
      .from("phone_numbers")
      .update({
        status: "released",
        inbound_agent_id: null,
        outbound_agent_id: null,
        vapi_phone_number_id: null,
      })
      .eq("id", phoneNumberId)
      .select()
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update phone number status",
          message: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedPhoneNumber,
        message: "Phone number successfully released",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error releasing phone number:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
