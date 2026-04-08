// One-shot bootstrap: ensure the "knowledge" storage bucket exists with
// authenticated RLS policies for insert/select/delete. Safe to run
// repeatedly — every step is idempotent.
//
// Deployed with --no-verify-jwt so it can be invoked by curl with just the
// anon key. It does its own auth via the ADMIN key, rejecting anonymous
// callers.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Create bucket if missing.
    const { data: existingBuckets, error: listErr } =
      await admin.storage.listBuckets();
    if (listErr) throw listErr;

    const alreadyExists = existingBuckets?.some((b) => b.id === "knowledge");
    let bucketCreated = false;

    if (!alreadyExists) {
      const { error: createErr } = await admin.storage.createBucket(
        "knowledge",
        {
          public: false,
          fileSizeLimit: 52428800, // 50 MB
          allowedMimeTypes: [
            "text/plain",
            "text/markdown",
            "text/html",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ],
        },
      );
      if (createErr) throw createErr;
      bucketCreated = true;
    }

    // 2. Add RLS policies for authenticated users via direct Postgres.
    //    Uses deno-postgres (Deno native) — esm.sh/postgres has connection
    //    cleanup issues in the edge runtime.
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    const policyResults: Record<string, string> = {};

    if (dbUrl) {
      const { Client } =
        await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
      const client = new Client(dbUrl);

      try {
        await client.connect();

        const policies: { name: string; ddl: string }[] = [
          {
            name: "knowledge_bucket_authenticated_insert",
            ddl: `CREATE POLICY "knowledge_bucket_authenticated_insert"
                  ON storage.objects FOR INSERT
                  TO authenticated
                  WITH CHECK (bucket_id = 'knowledge')`,
          },
          {
            name: "knowledge_bucket_authenticated_select",
            ddl: `CREATE POLICY "knowledge_bucket_authenticated_select"
                  ON storage.objects FOR SELECT
                  TO authenticated
                  USING (bucket_id = 'knowledge')`,
          },
          {
            name: "knowledge_bucket_authenticated_delete",
            ddl: `CREATE POLICY "knowledge_bucket_authenticated_delete"
                  ON storage.objects FOR DELETE
                  TO authenticated
                  USING (bucket_id = 'knowledge')`,
          },
          {
            name: "knowledge_bucket_authenticated_update",
            ddl: `CREATE POLICY "knowledge_bucket_authenticated_update"
                  ON storage.objects FOR UPDATE
                  TO authenticated
                  USING (bucket_id = 'knowledge')`,
          },
        ];

        for (const p of policies) {
          try {
            await client.queryArray(p.ddl);
            policyResults[p.name] = "created";
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("already exists")) {
              policyResults[p.name] = "already_exists";
            } else {
              policyResults[p.name] = `error: ${msg}`;
            }
          }
        }
      } finally {
        try {
          await client.end();
        } catch (_) {
          // ignore cleanup errors
        }
      }
    } else {
      policyResults["_warning"] =
        "SUPABASE_DB_URL not set — RLS policies NOT applied. Add them manually via the Supabase SQL editor.";
    }

    return new Response(
      JSON.stringify({
        ok: true,
        bucket: {
          id: "knowledge",
          created: bucketCreated,
          already_existed: alreadyExists,
        },
        policies: policyResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("bootstrap-storage error:", message, stack);
    return new Response(JSON.stringify({ ok: false, error: message, stack }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
