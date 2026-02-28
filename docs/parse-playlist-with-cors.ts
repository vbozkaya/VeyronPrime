/**
 * Supabase Edge Function: parse-playlist
 * İki mod: M3U URL parse veya Xtream Codes API (CONTENT_PARSING_REPORT.md ile uyumlu).
 * Çıktı: content_json { categories?, live, movies, series } — TV uygulaması mapBackendContentToState ile kullanır.
 */
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function toStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  return String(v);
}

/** M3U: satırları trim et, EXTINF ile hemen sonraki URL eşleştir, stabil id (streamUrl hash). */
function parseM3u(text: string): { live: unknown[] } {
  const lines = text.split("\n").map((l) => l.trim());
  const live: unknown[] = [];
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
      const streamUrl = line.trim();
      const stableId = "m3u-" + hashSimple(streamUrl);
      const categoryId = currentGroup || "0";
      live.push({
        id: stableId,
        streamId: stableId,
        name: currentName || "Kanal",
        logo: currentLogo,
        streamIcon: currentLogo,
        group: currentGroup,
        categoryId,
        categoryName: currentGroup,
        streamUrl,
        url: streamUrl,
        stream_url: streamUrl,
      });
    }
  }
  return { live };
}

function hashSimple(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/** Xtream: player_api.php çağrıları — rapor §2–5 ile uyumlu. */
async function fetchXtreamContent(baseUrl: string, username: string, password: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const q = (action: string, extra?: Record<string, string>) => {
    const p = new URLSearchParams({ username, password, action, ...extra });
    return `${base}/player_api.php?${p}`;
  };

  const [liveCatRes, liveRes, vodCatRes, vodRes, seriesCatRes, seriesRes] = await Promise.all([
    fetch(q("get_live_categories")),
    fetch(q("get_live_streams")),
    fetch(q("get_vod_categories")),
    fetch(q("get_vod_streams")),
    fetch(q("get_series_categories")),
    fetch(q("get_series")),
  ]);

  const liveCategories: { categoryId: string; categoryName: string }[] = [];
  const liveCatJson = (await liveCatRes.json()) || [];
  for (const c of liveCatJson) {
    const id = toStr(c.category_id);
    if (!id) continue;
    liveCategories.push({ categoryId: id, categoryName: toStr(c.category_name) || id });
  }

  const vodCategories: { categoryId: string; categoryName: string }[] = [];
  const vodCatJson = (await vodCatRes.json()) || [];
  for (const c of vodCatJson) {
    const id = toStr(c.category_id);
    if (!id) continue;
    vodCategories.push({ categoryId: id, categoryName: toStr(c.category_name) || id });
  }

  const seriesCategories: { categoryId: string; categoryName: string }[] = [];
  const seriesCatJson = (await seriesCatRes.json()) || [];
  for (const c of seriesCatJson) {
    const id = toStr(c.category_id);
    if (!id) continue;
    seriesCategories.push({ categoryId: id, categoryName: toStr(c.category_name) || id });
  }

  const live: unknown[] = [];
  const liveJson = (await liveRes.json()) || [];
  liveJson.forEach((ch: Record<string, unknown>, idx: number) => {
    const streamId = ch.stream_id;
    if (streamId == null) return;
    const cid = toStr(ch.category_id ?? "0");
    const playUrl = `${base}/live/${username}/${password}/${streamId}.ts`;
    live.push({
      streamId,
      name: toStr(ch.name),
      streamIcon: toStr(ch.stream_icon),
      categoryId: cid,
      categoryName: liveCategories.find((c) => c.categoryId === cid)?.categoryName ?? cid,
      group: cid,
      streamUrl: playUrl,
      url: playUrl,
      stream_url: playUrl,
      isAdult: (ch.is_adult as number) === 1,
      orderIndex: idx,
    });
  });

  const movies: unknown[] = [];
  const vodJson = (await vodRes.json()) || [];
  vodJson.forEach((m: Record<string, unknown>, idx: number) => {
    const streamId = m.stream_id;
    if (streamId == null) return;
    const ext = toStr(m.container_extension) || "mp4";
    const playUrl = `${base}/movie/${username}/${password}/${streamId}.${ext}`;
    movies.push({
      streamId,
      name: toStr(m.name),
      streamIcon: toStr(m.stream_icon),
      categoryId: toStr(m.category_id ?? "0"),
      containerExtension: ext,
      streamUrl: playUrl,
      url: playUrl,
      rating: toStr(m.rating),
      rating5Based: typeof m.rating_5based === "number" ? m.rating_5based : null,
      added: toStr(m.added),
      isAdult: (m.is_adult as number) === 1,
      orderIndex: idx,
    });
  });

  const series: unknown[] = [];
  const seriesJson = (await seriesRes.json()) || [];
  seriesJson.forEach((s: Record<string, unknown>, idx: number) => {
    const seriesId = s.series_id;
    if (seriesId == null) return;
    series.push({
      seriesId,
      name: toStr(s.name),
      cover: toStr(s.cover),
      backdropPath: Array.isArray(s.backdrop_path) ? toStr(s.backdrop_path[0]) : "",
      categoryId: toStr(s.category_id ?? "0"),
      plot: toStr(s.plot),
      rating: toStr(s.rating),
      rating5Based: typeof s.rating_5based === "number" ? s.rating_5based : null,
      isAdult: (s.is_adult as number) === 1,
      orderIndex: idx,
    });
  });

  return {
    categories: { live: liveCategories, movie: vodCategories, series: seriesCategories },
    live,
    movies,
    series,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const deviceId = body.deviceId ?? body.device_id;
    const m3uUrl = body.m3uUrl ?? body.m3u_url;
    const serverUrl = body.serverUrl ?? body.server_url;
    const username = body.username ?? "";
    const password = body.password ?? "";

    if (!deviceId) {
      return new Response(JSON.stringify({ error: "Missing deviceId" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let contentJson: { categories?: { live: unknown[]; movie: unknown[]; series: unknown[] }; live: unknown[]; movies: unknown[]; series: unknown[] };

    if (m3uUrl) {
      const m3uResponse = await fetch(m3uUrl);
      const m3uText = await m3uResponse.text();
      const parsed = parseM3u(m3uText);
      contentJson = { live: parsed.live, movies: [], series: [] };
    } else if (serverUrl && username && password) {
      contentJson = await fetchXtreamContent(serverUrl, username, password);
    } else {
      return new Response(
        JSON.stringify({ error: "Provide m3uUrl OR (serverUrl + username + password)" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const { error } = await supabase
      .from("parsed_content")
      .upsert(
        {
          device_id: deviceId,
          content_json: contentJson,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id" }
      );

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
