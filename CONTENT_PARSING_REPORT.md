# PNR TV Mobile – İçerik Parse Raporu

Bu rapor, projedeki **canlı kanallar**, **filmler** ve **diziler**in nasıl parse edildiğini, kategorilerin ve içerik kartlarının nasıl oluşturulduğunu, dizi bölümlerinin nasıl işlendiğini detaylı olarak açıklar. Samsung ve LG TV projelerinde aynı mantığı uygulamak için referans olarak kullanılabilir.

---

## 1. Genel Mimari

- **API:** Xtream Codes uyumlu IPTV panel API’si (`player_api.php`).
- **Base URL:** Kullanıcının `serverUrl` değeri. API adresi: `{serverUrl}/player_api.php`.
- **Kimlik doğrulama:** Her istekte `username` ve `password` query parametreleri gönderilir.
- **İçerik güncellemesi:** `ContentUpdateManager` tek seferde sırayla: canlı kategoriler → canlı kanallar → film kategorileri → filmler → dizi kategorileri → diziler çeker ve Room veritabanına yazar. Bölümler (sezon/dizi detayı) **ilk yüklemede değil**, kullanıcı bir diziyi açtığında `get_series_info` ile isteğe bağlı çekilir.

---

## 2. Kategoriler (Categories)

### 2.1 API Endpoint’leri

| İçerik tipi | Action parametresi        | Endpoint özeti |
|------------|---------------------------|----------------|
| Canlı      | `get_live_categories`     | GET, action=get_live_categories |
| Film (VOD) | `get_vod_categories`      | GET, action=get_vod_categories  |
| Dizi       | `get_series_categories`   | GET, action=get_series_categories |

Tümü aynı base URL’e GET ile istek atar; ek parametre: `username`, `password`, `action`.

### 2.2 Kategori DTO (CategoryDto)

```kotlin
data class CategoryDto(
    @SerializedName("category_id")   // API bazen Int bazen String dönebilir
    @JsonAdapter(CategoryIdTypeAdapter::class)
    val categoryId: String?,
    @SerializedName("category_name")
    val categoryName: String?,
    @SerializedName("parent_id")
    val parentId: Int?
)
```

- **category_id:** Mutlaka **string** olarak saklanmalı. API bazen sayı bazen string döndüğü için `CategoryIdTypeAdapter` kullanılır: `JsonToken.NUMBER` → `reader.nextLong().toString()`, `JsonToken.STRING` → `reader.nextString()`.
- **category_name:** Kategori adı.
- **parent_id:** Opsiyonel üst kategori (hiyerarşi için).

### 2.3 Kategori entity (veritabanı)

```kotlin
// CategoryEntity
categoryId: String      // Birincil eşleşme alanı
categoryName: String
parentId: String?      // parent_id string'e çevrilir
type: String           // "live" | "movie" | "series"
userId: Long
orderIndex: Int        // API cevabındaki sıra (mapIndexedNotNull index)
```

- **type:** Canlı için `"live"`, film için `"movie"`, dizi için `"series"`.
- **orderIndex:** Kategori listesi sırası; API’den gelen sıra korunur.

### 2.4 Kategori oluşturma akışı (ContentUpdateManager)

1. İlgili endpoint çağrılır (örn. `getLiveCategories`).
2. Kullanıcıya ait eski kategoriler silinir: `categoryDao.deleteCategoriesByType("live", userId)` (veya `"movie"` / `"series"`).
3. Gelen liste üzerinde:
   - `categoryId` boş/null olanlar **atlanır**.
   - Her biri `CategoryEntity`’e çevrilir: `categoryId`, `categoryName`, `parentId?.toString()`, `type`, `userId`, `orderIndex = index`.
4. `categoryDao.insertAll(entities)` ile toplu insert.

### 2.5 Sanal kategori: “Yeni Eklenenler” (Film & Dizi)

- Film ve dizi ekranlarında listeye **ekstra bir sanal kategori** eklenir.
- **Sabit ID:** `"__new_additions__"` (MoviesViewModel / SeriesViewModel içinde `NEW_ADDITIONS_CATEGORY_ID`).
- Bu kategori seçildiğinde API’den kategori listesi değil, **son eklenen içerik** listesi kullanılır:
  - Film: `movieRepository.getRecentlyAdded(userId, includeAdult)` (limit 30, `added` alanına göre DESC).
  - Dizi: `seriesRepository.getRecentlyAdded(userId, includeAdult)` (aynı mantık).

---

## 3. Canlı Kanallar (Live Channels)

### 3.1 API

- **Endpoint:** `get_live_streams`
- **Parametreler:** `username`, `password`, `action=get_live_streams`, `category_id` (opsiyonel; verilirse sadece o kategorideki kanallar döner; uygulama tüm kanalları tek istekte alıp yerelde kategoriye göre filtreler).

### 3.2 ChannelDto

```kotlin
num: Int?
name: String?
stream_type: String?
stream_id: Int?           // Önemli: benzersiz kanal ID
stream_icon: String?      // Logo URL
epg_channel_id: String?
added: String?
is_adult: Int?            // 0/1
category_id: String?      // CategoryIdTypeAdapter ile parse
category_ids: List<Int>?
custom_sid, tv_archive, direct_source, tv_archive_duration: ...
```

### 3.3 ChannelEntity (Room)

```kotlin
streamId: Int
name: String
streamIcon: String?
categoryId: String        // "0" veya API'deki category_id
categoryName: String?     // Bu projede ContentUpdateManager doldurmuyor; opsiyonel join ile doldurulabilir
epgChannelId: String?
added: String?
isAdult: Boolean          // dto.isAdult == 1
userId: Long
orderIndex: Int
```

- **streamId** null olan DTO’lar atlanır.
- **categoryId** null ise `"0"` atanır.

### 3.4 Parse ve kaydetme

1. `getLiveStreams(apiUrl, username, password)` çağrılır (category_id gönderilmez).
2. Kullanıcının tüm kanalları silinir: `channelDao.deleteAllByUser(userId)`.
3. Liste `mapIndexedNotNull` ile entity’e çevrilir; `streamId` zorunlu.
4. `channelDao.insertAll(entities)`.

### 3.5 Canlı yayın URL’i

Xtream formatı:

```
{baseUrl}/live/{username}/{password}/{streamId}.ts
```

- `baseUrl`: Sonundaki `/` temizlenmiş server URL.
- Varsayılan uzantı `ts`; farklı sunucular için parametrik bırakılmış.

---

## 4. Filmler (VOD / Movies)

### 4.1 API

- **Liste:** `get_vod_streams` (parametreler: username, password, action, opsiyonel category_id).
- **Detay (tek film):** `get_vod_info` — parametreler: `vod_id` (Int) = filmin `stream_id`’si.

### 4.2 MovieDto (liste)

```kotlin
num, name, stream_type, stream_id: Int?
stream_icon: String?
rating: String?
rating_5based: Double?
added: String?
is_adult: Int?
category_id: String?
category_ids: List<Int>?
container_extension: String?   // "mp4", "mkv" vb.
custom_sid, direct_source: ...
```

### 4.3 MovieEntity (Room)

```kotlin
streamId: Int
name: String
streamIcon: String?
backdropPath: String?     // Liste DTO'da yok; get_vod_info'dan gelebilir
rating: String?
rating5Based: Float?
plot, tmdbId, trailer: String?
categoryId: String
categoryIds: String?      // List<Int> join veya JSON string
containerExtension: String?
added: String?
isAdult: Boolean
director, cast, genre, releaseDate, duration: String?
userId: Long
orderIndex: Int
```

- Liste parse’da: `streamId` null olan atlanır; `categoryId` null ise `"0"`.
- Detay (get_vod_info) ayrı bir akışta kullanılır; liste yüklemesinde zorunlu değil.

### 4.4 Film parse ve kaydetme

1. `getVodStreams(apiUrl, username, password)`.
2. `movieDao.deleteAllByUser(userId)`.
3. DTO → Entity: streamId, name, streamIcon, rating, rating5Based, categoryId, containerExtension, added, isAdult, userId, orderIndex (backdropPath/plot/trailer vb. liste cevabında yoksa boş kalır).
4. `movieDao.insertAll(entities)`.

### 4.5 Film oynatma URL’i

```
{baseUrl}/movie/{username}/{password}/{streamId}.{containerExtension}
```

- `containerExtension` yoksa uygulama tarafında varsayılan (örn. `mp4`) kullanılır.

### 4.6 Puan (rating) gösterimi

- API’de `rating_5based` (5 üzerinden) veya `rating` (10 üzerinden string) gelebilir.
- Domain model’de 10 üzerinden tek değer hesaplanır: `rating5Based > 0` ise `* 2`, değilse `rating` parse edilir; 5’ten küçükse yine `* 2`.
- Gösterim: `String.format("%.1f", ratingValue10)`.
- Renk seviyesi: HIGH (≥7), MEDIUM (≥4.5), LOW (>0), NONE.

---

## 5. Diziler (Series)

### 5.1 API

- **Liste:** `get_series` (username, password, action=get_series, opsiyonel category_id).
- **Detay + bölümler:** `get_series_info` — parametre: `series_id` (Int) = dizinin `series_id`’si.

### 5.2 SeriesDto (liste)

```kotlin
num: Int?
name: String?
series_id: Int?
cover: String?
plot, cast, director, genre: String?
releaseDate: String?
last_modified: String?
rating: String?
rating_5based: Double?
backdrop_path: List<String>?   // İlk eleman kullanılır
youtube_trailer: String?
episode_run_time: String?
category_id: String?
category_ids: List<Int>?
is_adult: Int?
```

### 5.3 SeriesEntity (Room)

```kotlin
seriesId: Int
name: String
cover: String?
backdropPath: String?     // dto.backdropPath?.firstOrNull()
plot, cast, director, genre, releaseDate: String?
rating: String?
rating5Based: Float?
episodeRunTime: String?
youtubeTrailer: String?
categoryId: String
lastModified → added: String?
isAdult: Boolean
userId: Long
orderIndex: Int
```

- `seriesId` null olan DTO’lar atlanır; `categoryId` null ise `"0"`.

### 5.4 Dizi parse ve kaydetme

1. `getSeries(apiUrl, username, password)`.
2. `seriesDao.deleteAllByUser(userId)`.
3. DTO → Entity (yukarıdaki alan eşlemesi).
4. `seriesDao.insertAll(entities)`.

---

## 6. Dizi bölümleri (Sezonlar ve Episodes)

Bölümler **ilk içerik senkronizasyonunda çekilmez**. Kullanıcı bir dizinin detayına girdiğinde `get_series_info` çağrılır; cevap hem sezon listesini hem sezon bazlı bölüm listesini içerir.

### 6.1 API: get_series_info

- **Parametreler:** `username`, `password`, `action=get_series_info`, `series_id` (Int).

### 6.2 SeriesInfoResponse

```kotlin
data class SeriesInfoResponse(
    @SerializedName("seasons")   val seasons: List<SeasonDto>?,
    @SerializedName("info")      val info: SeriesInfoDto?,
    @SerializedName("episodes")  val episodes: Map<String, List<EpisodeDto>>?
)
```

- **seasons:** Sezon meta bilgisi (ad, bölüm sayısı, kapak vb.).
- **info:** Dizi genel bilgisi (isteğe bağlı zenginleştirme).
- **episodes:** Ana bölüm verisi. **Key = sezon numarası string** ("1", "2", "01" vb.). **Value = o sezondaki bölüm listesi.**

### 6.3 SeasonDto

```kotlin
air_date: String?
episode_count: Int?
id: Int?
name: String?
overview: String?
season_number: Int?
cover: String?
cover_big: String?
```

### 6.4 EpisodeDto

```kotlin
id: String?                    // Önemli: oynatma URL'inde kullanılır (episodeId)
episode_num: Int?
title: String?
container_extension: String?
info: EpisodeInfoDto?
custom_sid, added: String?
season: Int?
direct_source: String?
```

**EpisodeInfoDto:**

```kotlin
movie_image: String?
plot: String?
releasedate: String?
rating: Double?
duration_secs: Int?
duration: String?
bitrate: Int?
video: VideoInfoDto?
audio: AudioInfoDto?
```

### 6.5 Sezon anahtarının esnek parse’ı

API bazen sezon numarasını `"1"`, bazen `"01"` vb. verebilir. Bu yüzden bölüm listesi alınırken:

- Önce `episodes["1"]` veya `episodes[seasonNumber.toString()]` dene.
- Bulunamazsa `episodes[seasonNumber.toString().padStart(2, '0')]` dene.
- Hâlâ yoksa: `episodes.entries.find { (key, _) -> key.toIntOrNull() == seasonNumber }?.value`.

(EpisodeListViewModel ve SeriesDetailViewModel’de bu mantık kullanılıyor.)

### 6.6 Domain modelleri (bölüm ekranı için)

**Season (domain):**

```kotlin
id: Int
name: String
seasonNumber: Int
episodeCount: Int
overview: String?
airDate: String?
cover: String?
coverBig: String?
```

**Episode (domain):**

```kotlin
id: String               // API'deki id; oynatma URL'inde kullanılır
episodeNum: Int
title: String
seasonNumber: Int
containerExtension: String?
plot: String?
image: String?           // info.movieImage
releaseDate: String?
rating: Double?
durationSecs: Int?
duration: String?
```

- **id** null olan episode DTO’ları atlanır.
- **title** boşsa: `"Episode ${dto.episodeNum}"`.
- Bölümler sezon içinde `episodeNum`’a göre sıralanır: `sortedBy { it.episodeNum }`.

### 6.7 Sezon listesi yoksa türetme

API bazen `seasons` boş, `episodes` dolu dönebilir. Bu durumda:

- `episodes.keys` (string sezon numaraları) `toIntOrNull()` ile sayıya çevrilip sıralanır.
- Her sezon numarası için sentetik bir `Season` oluşturulur: `name = "Season $seasonNum"`, `episodeCount = episodes[seasonNum]?.size ?: 0`.

### 6.8 Dizi bölümü oynatma URL’i

```
{baseUrl}/series/{username}/{password}/{episodeId}.{containerExtension}
```

- **episodeId:** `Episode.id` (API’deki string `id`).
- **containerExtension:** `Episode.containerExtension`; yoksa varsayılan (örn. `mp4`).

---

## 7. İçerik kartları (UI)

### 7.1 Ortak bileşenler (ContentCard.kt)

- **PosterCard:** Başlık, poster URL, opsiyonel rating; 2:3 poster oranı; tıklanınca detay/oynat.
- **ChannelCard:** Kanal adı, logo URL; kare/kanal kutusu oranı; tıklanınca oynat.
- **BackdropCard:** Başlık, backdrop URL, opsiyonel rating; 16:9; tıklanınca detay/oynat.
- **RatingBadge:** 7+ HIGH, 4.5+ MEDIUM, >0 LOW renkleri; metin `"%.1f"` rating.

### 7.2 Ekrana özel kartlar

- **Live TV:** `ChannelCard` benzeri; logo + kanal adı + alt gradient; `channel.displayIcon` (streamIcon), `channel.name`; grid: `GridCells.Adaptive(minSize = 140.dp)`.
- **Filmler:** Poster oranı 0.67 (2:3); `movie.displayPoster` (streamIcon), `movie.name`, `movie.year` (releaseDate’in ilk 4 karakteri), `movie.hasRating` / `movie.displayRating` / `movie.ratingColor`; grid: minSize 130.dp.
- **Diziler:** Aynı poster oranı; `series.displayCover` (cover), `series.name`, `series.year`, rating aynı mantık; grid: minSize 130.dp.

### 7.3 Kategori listesi (sidebar)

- **Live:** `Category` listesi; `category.categoryId`, `category.categoryName`; “Tüm Kanallar” seçeneği.
- **Film/Dizi:** Aynı yapı + en başta sanal “Yeni Eklenenler” (`categoryId == "__new_additions__"`); “Tüm Filmler” / “Tüm Diziler” seçeneği.
- Seçim: `selectedCategory?.categoryId` ile karşılaştırma; “Tümü” için `selectedCategory == null`.

---

## 8. Veri akışı özeti

| Adım | Canlı | Film | Dizi |
|------|--------|------|------|
| 1 | get_live_categories → CategoryEntity (type=live) | get_vod_categories → CategoryEntity (type=movie) | get_series_categories → CategoryEntity (type=series) |
| 2 | get_live_streams → ChannelEntity | get_vod_streams → MovieEntity | get_series → SeriesEntity |
| 3 | - | - | (Kullanıcı detay açınca) get_series_info → Season + Episode (memory/UI) |
| Filtreleme | categoryId, isAdult | categoryId, isAdult; “Yeni Eklenenler” = getRecentlyAdded | Aynı |
| Sıralama | orderIndex | orderIndex; “Yeni Eklenenler”: added DESC, limit 30 | Aynı |

---

## 9. Yetişkin içeriği (isAdult)

- Tüm içerik tiplerinde DTO’da `is_adult: Int?` (0/1) → entity’de `isAdult: Boolean`.
- Kullanıcı “yetişkin kilidi” açmamışsa:
  - Channel: `getChannelsByCategoryNonAdult` / `getAllChannelsNonAdult`
  - Movie: `getMoviesByCategoryNonAdult` / `getAllMoviesNonAdult` / `getRecentlyAddedNonAdult`
  - Series: `getSeriesByCategoryNonAdult` / `getAllSeriesNonAdult` / `getRecentlyAddedNonAdult`
- Açıksa `includeAdult = true` ile adult dahil sorgular kullanılır.

---

## 10. Özet: Samsung/LG TV projesinde uygulama notları

1. **API base:** `{serverUrl}/player_api.php`; her istekte `username`, `password`, `action`.
2. **category_id:** Her zaman string’e normalize et (CategoryIdTypeAdapter mantığı).
3. **Kategoriler:** Önce kategorileri çek ve sakla (type: live/movie/series); sonra ilgili içerik listesini çek.
4. **İçerik listeleri:** Tek seferde tüm kanallar/filmler/diziler çekilip yerelde kategoriye ve isAdult’a göre filtrelenebilir.
5. **Dizi bölümleri:** Sadece detay ekranında `get_series_info` ile al; `episodes` map’inde key sezon numarası (string), value bölüm listesi; sezon anahtarını esnek parse et ("1"/"01"/sayı).
6. **URL’ler:** Canlı `.../live/...`, film `.../movie/...`, dizi bölümü `.../series/...`; bölümde path’te `episodeId` (string) kullanılır.
7. **“Yeni Eklenenler”:** Sanal kategori ID’si (örn. `__new_additions__`); içerik listesi için `added` DESC, limit 30.
8. **Rating:** 5 tabanlı * 2 = 10 tabanlı; renk seviyeleri HIGH/MEDIUM/LOW/NONE ile kartlarda kullanılabilir.

Bu doküman, PNR TV Mobile kod tabanından çıkarılmıştır ve Samsung/LG TV uygulamasında aynı Xtream API’yi kullanırken parse ve veri modelinin tutarlı olması için referans alınabilir.
