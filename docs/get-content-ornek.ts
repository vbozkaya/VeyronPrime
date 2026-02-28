// Supabase Edge Function: get-content
// Body'den device_id veya deviceId alır; parsed_content tablosundan content_json döner.

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const deviceId = (body.deviceId ?? body.device_id ?? "").toString().trim();

    if (!deviceId) {
      return new Response(
        JSON.stringify({ error: "Missing deviceId" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const { data, error } = await supabase
      .from("parsed_content")
      .select("content_json")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (!data || !data.content_json) {
      return new Response(
        JSON.stringify({ live: [], movies: [], series: [] }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data.content_json), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
