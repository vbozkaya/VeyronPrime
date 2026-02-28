import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const deviceId = body.deviceId ?? body.device_id ?? "";
    const deviceKey = body.deviceKey ?? body.device_key ?? "";
    const fromPanel = body.from_panel === true;

    if (!deviceId || !deviceKey) {
      return new Response(
        JSON.stringify({ error: "Missing parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Panelden gelen istek: sadece doğrula, asla yeni cihaz oluşturma
    if (fromPanel) {
      if (!data) {
        return new Response(
          JSON.stringify({ error: "Geçersiz cihaz bilgisi" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (data.device_key !== deviceKey) {
        return new Response(
          JSON.stringify({ error: "Geçersiz cihaz bilgisi" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ status: "valid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // TV uygulaması: cihaz yoksa oluştur
    if (!data) {
      const { error: insertError } = await supabase
        .from("devices")
        .insert({
          device_id: deviceId,
          device_key: deviceKey
        });

      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Insert failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ status: "created" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Cihaz varsa key kontrol et
    if (data.device_key !== deviceKey) {
      return new Response(
        JSON.stringify({ error: "Invalid device key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ status: "valid" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
