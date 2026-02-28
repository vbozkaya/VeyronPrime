# Supabase Edge Function'lara CORS Ekleme

Panel (device-panel.vercel.app) Supabase'e istek atarken tarayıcı "CORS" hatası veriyorsa, **her Edge Function dosyasında** aşağıdakileri yap.

---

## 1. CORS header'larını tanımla

Fonksiyonun **en üstünde** (import'lardan sonra) şunu ekle:

```ts
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};
```

---

## 2. OPTIONS isteğini hemen cevapla

`serve` veya ana handler'ın **en başında** (diğer hiçbir iş yapmadan önce) şunu yaz:

```ts
if (req.method === "OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
```

Yani handler şöyle başlamalı:

```ts
Deno.serve(async (req) => {
  // 1) Önce OPTIONS'ı cevapla
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // 2) Sonra asıl işine (POST/GET) devam et...
  try {
    const body = await req.json();
    // ... parse-playlist, check-device vs. ...
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
```

---

## 3. Tüm Response'lara CORS ekle

Fonksiyon içinde **kaç yerde** `return new Response(...)` yazıyorsan, **hepsinde** `headers` içine `...CORS_HEADERS` ekle. Örnek:

```ts
// Başarı
return new Response(JSON.stringify({ status: "valid" }), {
  status: 200,
  headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
});

// Hata
return new Response(JSON.stringify({ error: "Unauthorized" }), {
  status: 401,
  headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
});
```

---

## 4. Hangi dosyalara ekleyeceğin

- `parse-playlist/index.ts` (veya `parse-playlist.ts`)
- `check-device/index.ts`
- `get-content/index.ts`

Her birinde:  
1) `CORS_HEADERS` tanımı,  
2) Handler'ın en başında OPTIONS cevabı,  
3) Tüm `Response` çıktılarına `...CORS_HEADERS` eklenmesi.

Bunu yaptıktan sonra Supabase'e tekrar deploy et (veya otomatik deploy varsa commit at). Panelden tekrar dene.
