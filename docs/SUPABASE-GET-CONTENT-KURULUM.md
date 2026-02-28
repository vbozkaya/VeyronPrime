# get-content 400 Hatası – Supabase Tarafında Yapılacaklar

TV uygulaması `device_id` ve `deviceId` gönderiyor; mevcut get-content muhtemelen farklı bir format bekliyor veya hata durumunda 400 dönüyor. Aşağıdaki kodu Supabase’e deploy et.

---

## Adımlar

1. **Supabase Dashboard** → **Edge Functions** → **get-content** fonksiyonunu aç.
2. Fonksiyonun **tüm kodunu sil** ve aşağıdaki kodu **aynen** yapıştır.
3. **Deploy** / **Save** ile kaydet.

---

## Kullanılacak kod

`docs/get-content-ornek.ts` dosyasının tam içeriği (yukarıda). Veya aşağıdaki blok:

```ts
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
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
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
```

---

## Bu kod ne yapıyor?

- Body’den hem **deviceId** hem **device_id** okuyor (TV ikisini de gönderiyor).
- deviceId yoksa veya boşsa **400** döner.
- **parsed_content** tablosunda ilgili device_id için kayıt yoksa **400 değil**, **200** ile `{ live: [], movies: [], series: [] }` döner (TV “içerik yok” mesajını kendisi gösterir).
- Kayıt varsa **content_json** içeriğini 200 ile döner.
- CORS ve OPTIONS cevabı ekli; panel/TV’den çağrıda sorun çıkmaz.

Bu kodu deploy ettikten sonra TV’de “Güncelle” tekrar deneyin; 400 yerine ya içerik gelecek ya da “İçerik yok” mesajı görünecek.
