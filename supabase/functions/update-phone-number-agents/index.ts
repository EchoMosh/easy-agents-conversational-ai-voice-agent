import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
};

interface UpdatePhoneNumberAgentsRequest {
  phoneNumberId: string;
  inboundAgentId?: string | null;
  outboundAgentId?: string | null;
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

    const { phoneNumberId, inboundAgentId, outboundAgentId } =
      (await req.json()) as UpdatePhoneNumberAgentsRequest;

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
          error: "Unauthorized: Only workspace admins can update phone numbers",
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

    // If inboundAgentId is being set, validate it and update VAPI
    if (inboundAgentId !== undefined) {
      if (inboundAgentId) {
        // Validate the agent exists in this workspace
        const { data: inboundAgent, error: inboundAgentError } = await supabase
          .from("agents")
          .select("id, v_agent_id, workspace_id")
          .eq("id", inboundAgentId)
          .eq("workspace_id", phoneNumber.workspace_id)
          .single();

        if (inboundAgentError || !inboundAgent) {
          return new Response(
            JSON.stringify({ error: "Invalid inbound agent ID" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        // Update VAPI phone number with the assistant
        if (phoneNumber.vapi_phone_number_id && inboundAgent.v_agent_id) {
          try {
            const vapiResponse = await fetch(
              `https://api.vapi.ai/phone-numbers/${phoneNumber.vapi_phone_number_id}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${vapiApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ assistantId: inboundAgent.v_agent_id }),
              },
            );

            if (!vapiResponse.ok) {
              console.error(
                "Failed to update VAPI phone number:",
                await vapiResponse.text(),
              );
            }
          } catch (vapiError) {
            console.error("VAPI update error:", vapiError);
          }
        }
      } else {
        // inboundAgentId is null -- remove assistant from VAPI
        if (phoneNumber.vapi_phone_number_id) {
          try {
            const vapiResponse = await fetch(
              `https://api.vapi.ai/phone-numbers/${phoneNumber.vapi_phone_number_id}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${vapiApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ assistantId: "" }),
              },
            );

            if (!vapiResponse.ok) {
              console.error(
                "Failed to clear VAPI assistant:",
                await vapiResponse.text(),
              );
            }
          } catch (vapiError) {
            console.error("VAPI update error:", vapiError);
          }
        }
      }
    }

    // If outboundAgentId is being set, validate it
    if (outboundAgentId) {
      const { data: outboundAgent, error: outboundAgentError } = await supabase
        .from("agents")
        .select("id, workspace_id")
        .eq("id", outboundAgentId)
        .eq("workspace_id", phoneNumber.workspace_id)
        .single();

      if (outboundAgentError || !outboundAgent) {
        return new Response(
          JSON.stringify({ error: "Invalid outbound agent ID" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Update the phone number record in DB
    const updateData: Record<string, unknown> = {};
    if (inboundAgentId !== undefined) {
      updateData.inbound_agent_id = inboundAgentId;
    }
    if (outboundAgentId !== undefined) {
      updateData.outbound_agent_id = outboundAgentId;
    }

    const { data: updatedPhoneNumber, error: updateError } = await supabase
      .from("phone_numbers")
      .update(updateData)
      .eq("id", phoneNumberId)
      .select(
        `
        *,
        inbound_agent:agents!phone_numbers_inbound_agent_id_fkey(
          id,
          name,
          v_agent_id
        ),
        outbound_agent:agents!phone_numbers_outbound_agent_id_fkey(
          id,
          name,
          v_agent_id
        )
      `,
      )
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update phone number",
          message: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: updatedPhoneNumber }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error updating phone number agents:", error);
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
