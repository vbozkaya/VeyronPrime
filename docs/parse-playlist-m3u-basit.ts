// Supabase Edge Function: parse-playlist (sadece M3U URL)
// Panelden deviceId + m3uUrl alır, M3U indirir, parse eder, parsed_content'e yazar.

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
    const m3uUrl = (body.m3uUrl ?? body.m3u_url ?? "").toString().trim();

    if (!deviceId || !m3uUrl) {
      return new Response(
        JSON.stringify({ error: "Missing deviceId or m3uUrl" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const m3uResponse = await fetch(m3uUrl);
    if (!m3uResponse.ok) {
      return new Response(
        JSON.stringify({ error: "M3U indirilemedi: " + m3uResponse.status }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
    const m3uText = await m3uResponse.text();
    const lines = m3uText.split("\n").map((l) => l.trim());

    const live: { id: string; name: string; logo: string; group: string; streamUrl: string }[] = [];
    let currentName = "";
    let currentLogo = "";
    let currentGroup = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("#EXTINF")) {
        const nameMatch = line.match(/,(.*)$/);
        currentName = nameMatch ? nameMatch[1].trim() : "";
        const logoMatch = line.match(/tvg-logo="(.*?)"/);
        currentLogo = logoMatch ? logoMatch[1] : "";
        const groupMatch = line.match(/group-title="(.*?)"/);
        currentGroup = groupMatch ? groupMatch[1] : "";
        continue;
      }
      if (line.startsWith("http")) {
        live.push({
          id: "m3u-" + i + "-" + Math.abs(line.length).toString(36),
          name: currentName || "Kanal " + (live.length + 1),
          logo: currentLogo,
          group: currentGroup || "Genel",
          streamUrl: line.trim(),
        });
      }
    }

    const contentJson = { live, movies: [], series: [] };

    const row: Record<string, unknown> = {
      device_id: deviceId,
      content_json: contentJson,
    };
    const { data: existing } = await supabase
      .from("parsed_content")
      .select("device_id")
      .eq("device_id", deviceId)
      .maybeSingle();

    let err: { message: string } | null = null;
    if (existing) {
      const res = await supabase
        .from("parsed_content")
        .update({ content_json: contentJson })
        .eq("device_id", deviceId);
      err = res.error;
    } else {
      const res = await supabase.from("parsed_content").insert(row);
      err = res.error;
    }

    if (err) {
      return new Response(
        JSON.stringify({ error: "DB write failed: " + err.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, liveCount: live.length }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
