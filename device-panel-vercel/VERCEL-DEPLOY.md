# Vercel'de Panel Deploy Kontrolü

https://veyron-prime.vercel.app güncel görünmüyorsa aşağıdakileri kontrol edin.

## 1. Root Directory

- Vercel Dashboard → Proje → **Settings** → **General**
- **Root Directory** mutlaka **`device-panel-vercel`** olmalı (veya bu klasörün tam yolu).
- Boş bırakılırsa repo kökü deploy edilir; panel dosyaları orada olmadığı için eski/yanlış sayfa çıkar.

## 2. Redeploy

- **Deployments** sekmesine gidin.
- En son deployment'ın GitHub'daki son commit'ten (örn. "Dashboard: get-playlist...") olduğundan emin olun.
- Değilse: **Redeploy** veya repo'ya yeni bir push atıp otomatik deploy'u bekleyin.

## 3. Branch

- **Settings** → **Git** → **Production Branch** = `master` (veya kullandığınız branch).

## 4. Önbellek

- Tarayıcıda **Ctrl+F5** (Windows) veya **Cmd+Shift+R** (Mac) ile sert yenileme yapın.
- Güncel panelde sayfanın en altında **"Panel v2 · get-playlist · Sadece playlist adı"** yazısı görünür.

## 5. Doğru Repo

- Vercel projesi **vbozkaya/VeyronPrime** repo'suna bağlı olmalı.
- Başka bir fork veya repo'ya bağlıysa oradan deploy alıyorsunuz demektir.
