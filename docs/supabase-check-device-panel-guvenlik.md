# check-device: Panel güvenliği (from_panel)

Panelden yanlış device id/key ile oturum açılmasın diye **Supabase check-device** fonksiyonunda aşağıdaki mantık kullanılmalı.

## Kural

- **Panelden gelen istek** (`body.from_panel === true`): Sadece **doğrula**. Cihaz yoksa **oluşturma**, 403 döndür.
- **TV uygulamasından gelen istek** (`from_panel` yok veya false): Cihaz yoksa **oluştur**, varsa key’i doğrula.

## check-device fonksiyonunda yapılacaklar

Body'den hem `device_id` / `device_key` hem `deviceId` / `deviceKey` okuyabilirsiniz (panel camelCase, TV ikisini de gönderiyor).

```ts
const deviceId = body.deviceId ?? body.device_id;
const deviceKey = body.deviceKey ?? body.device_key;
const fromPanel = body.from_panel === true;
```

**Mantık:**

1. `deviceId` veya `deviceKey` yoksa → 400 "missing device id" veya "missing device key".
2. **fromPanel === true** (panel):
   - `devices` tablosunda bu `device_id` ile kayıt var mı bak.
   - **Yoksa** → **403** (veya 401), body: `{ error: "Geçersiz cihaz bilgisi" }`. **Asla yeni kayıt oluşturma.**
   - Varsa → `device_key` eşleşiyor mu?
     - Eşleşiyorsa → 200, `{ status: "valid" }`.
     - Eşleşmiyorsa → 403, `{ error: "Geçersiz cihaz bilgisi" }`.
3. **fromPanel !== true** (TV uygulaması):
   - Cihaz yoksa → **insert** (device_id, device_key), sonra 200 `{ status: "created" }`.
   - Cihaz varsa ve key eşleşiyorsa → 200 `{ status: "valid" }`.
   - Cihaz varsa ama key eşleşmiyorsa → 403.

## Akış özeti

| Kaynak | from_panel | Cihaz DB'de yok | Cihaz DB'de var, key doğru | Cihaz DB'de var, key yanlış |
|--------|------------|------------------|-----------------------------|-----------------------------|
| Panel  | true       | 403              | 200                         | 403                         |
| TV     | (yok)      | 200 + insert     | 200                         | 403                         |

Böylece:

- TV uygulaması açıldığında check-device çağrılır → cihaz yoksa oluşturulur.
- Kullanıcı panelde **sadece TV’de gördüğü** id/key’i girer → Supabase’de zaten kayıtlı olduğu için 200 alır, oturum açılır.
- Rastgele id/key giren biri → DB’de kayıt yok (veya key yanlış) → 403, oturum açılmaz.
