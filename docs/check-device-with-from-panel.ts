// Supabase Edge Function: check-device
// Panel güvenliği: from_panel true ise sadece doğrula, yeni cihaz oluşturma.

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
    const deviceId = body.deviceId ?? body.device_id ?? "";
    const deviceKey = body.deviceKey ?? body.device_key ?? "";
    const fromPanel = body.from_panel === true;

    if (!deviceId || !deviceKey) {
      return new Response(
        JSON.stringify({ error: "missing device id or key" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from("devices")
      .select("device_key")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (fromPanel) {
      // Panel: sadece doğrula, asla yeni kayıt oluşturma
      if (fetchError || !existing) {
        return new Response(
          JSON.stringify({ error: "Geçersiz cihaz bilgisi" }),
          { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      if (existing.device_key !== deviceKey) {
        return new Response(
          JSON.stringify({ error: "Geçersiz cihaz bilgisi" }),
          { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ status: "valid" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // TV uygulaması: yoksa oluştur
    if (!existing) {
      const { error: insertError } = await supabase
        .from("devices")
        .upsert({ device_id: deviceId, device_key: deviceKey }, { onConflict: "device_id" });
      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ status: "created" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (existing.device_key !== deviceKey) {
      return new Response(
        JSON.stringify({ error: "Geçersiz cihaz bilgisi" }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: "valid" }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
