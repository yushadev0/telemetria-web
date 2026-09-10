# Telemetria — Yeni Client Planı (React + Vite)

> Bu doküman, mevcut **Delphi/uniGUI** tabanlı client'ın yerine geçecek **React + Vite + TypeScript** tabanlı yeni web client'ının detaylı planıdır.
> Backend (`telemetria-api`) **hazır ve değişmeyecek** — her iki mod (F1 geçmiş telemetri + Assetto Corsa canlı) için gereken tüm uçlar mevcut.
> Amaç: **tüm mevcut özellikleri birebir korumak**, modern bir tasarım sistemi + açık/koyu tema ile yeniden yazmak, ve mevcut mimarinin yapısal hatalarını (bloklama, timeout, çift-tetikleme, görsel döngüsü) kökünden kaldırmak.

---

## 0. Neden yeniden yazıyoruz?

Mevcut client, tarayıcı ile Python API arasında **Delphi'yi aracı (proxy)** olarak kullanıyor:

```
Tarayıcı ──ajaxRequest──► uniGUI (IIS/ISAPI) ──► Delphi handler ──HTTP──► Python API
                                                      │
                                       sgcWebSocketClient ──WS──► Python API
                                                      │
                                       UniTimer (200ms poll) ──AddJS──► Tarayıcı
```

Bu mimariden kaynaklanan kronik sorunlar:

| Sorun | Kök neden |
|---|---|
| uniGUI timeout / "Connection Error" | Senkron HTTP çağrısı session thread'ini bloke ediyor |
| Aynı isteğin 2 kez gitmesi, biri boş dönüp UI'ı eziyor | uniGUI callback retry + eşzamanlılık; dedupe yok |
| Görsel 404 → sonsuz `onerror` döngüsü → render kilidi | Placeholder da ölü domende |
| Her değişiklikte Delphi derleme + ISAPI deploy + app pool recycle | Ağır döngü |
| Debug DLL prod'da, tek exe | Build hijyeni yok |

**React client'ta bu katman tamamen kalkıyor.** Tarayıcı doğrudan API ile `fetch` + native `WebSocket` üzerinden konuşur. Backend'de `CORSMiddleware allow_origins=["*"]` zaten açık.

```
Tarayıcı (React SPA) ──fetch──► Python API (REST)
                     ──WebSocket──► Python API (/ws/live/{room})
```

Kazanımlar: aracı yok, derleme yok, TanStack Query ile otomatik dedupe/cache/retry, URL-driven navigasyon (breadcrumb + geri tuşu + paylaşılabilir link bedava), gerçek build pipeline.

---

## 1. Teknoloji seçimleri

| Alan | Seçim | Gerekçe |
|---|---|---|
| Dil | **TypeScript** | API tipleri + telemetri veri şekilleri kritik; tip güvenliği |
| Build | **Vite 5** | Hızlı dev server, basit prod build (`dist/` static) |
| UI | **React 18** | Ekip aşinalığı, ekosistem |
| Routing | **React Router v6** | Akışı URL'e taşır → breadcrumb/geri/paylaşım bedava, çift-tetikleme biter |
| Server state | **TanStack Query (React Query) v5** | **Eşzamanlı aynı isteği otomatik dedupe eder** (mevcut en can sıkıcı bug), cache + `staleTime` + retry + loading/error state |
| Client state | **Zustand** | Tema, dil, compare seçimi, simülasyon oynatma durumu gibi global UI state |
| Grafikler | **Chart.js 4 + react-chartjs-2** | Mevcut grafik/plugin mantığı birebir port edilebilir (düşük risk). `syncCursor` plugin'i ve scrubber taşınır |
| Canvas (pist haritası + sim) | **Plain Canvas 2D**, `requestAnimationFrame` custom hook | Mevcut matematik port edilir |
| Stil | **CSS custom properties + CSS Modules** (veya Tailwind v4 CSS-first) | Mevcut tasarım zaten token tabanlı; `[data-theme]` ile açık/koyu |
| Animasyon | **Framer Motion** | Ekran geçişleri, kart cascade, pan/zoom — manuel `setTimeout` koreografisi yerine |
| i18n | **i18next + react-i18next** | Mevcut `telemetria_i18n.js` flat objesi `tr.json`/`en.json`'a taşınır (nested `countries`/`events`/`sessions`/`laps` korunur) |
| WebSocket | Custom `useAcSocket` hook (native WS + reconnect + PING) | Delphi sgc + timer-poll köprüsünün yerine |
| İkonlar | **lucide-react** (+ gerekirse birkaç FA) | Modern, hafif. NOT: mevcut `fa-car-formula` FA6 **Pro** olabilir — alternatif ikon gerekir |
| Fontlar | `@fontsource/titillium-web` + `@fontsource/montserrat` | Mevcut fontlar; CDN yerine bundle |
| Test (opsiyonel) | Vitest + Testing Library | Kritik hook'lar (sim motoru, WS, format) |
| Lint/format | ESLint + Prettier | — |

---

## 2. Proje yapısı

Kök klasöre yeni bir dizin: **`telemetria-web/`** (`telemetria-client/` Delphi projesi arşivlenir/dokunulmaz).

```
telemetria-web/
├─ index.html
├─ vite.config.ts
├─ .env                       # VITE_API_BASE_URL, VITE_WS_BASE_URL (dev)
├─ .env.production
├─ package.json
├─ tsconfig.json
├─ public/
│  └─ assets/                 # track_placeholder, driver_placeholder, logo (yerel!)
└─ src/
   ├─ main.tsx
   ├─ App.tsx                 # Router + providers (Query, i18n, Theme)
   ├─ routes/
   │  ├─ index.tsx            # Mod seçimi (F1 / AC)
   │  ├─ f1/
   │  │  ├─ YearsRoute.tsx
   │  │  ├─ RacesRoute.tsx
   │  │  ├─ SessionsRoute.tsx
   │  │  ├─ DriversRoute.tsx
   │  │  ├─ TelemetryRoute.tsx
   │  │  └─ CompareRoute.tsx
   │  └─ ac/
   │     ├─ RoomRoute.tsx
   │     └─ LiveRoute.tsx
   ├─ api/
   │  ├─ client.ts            # fetch wrapper, base URL, hata normalize
   │  ├─ schedule.ts          # years/races/sessions/drivers query hook'ları
   │  ├─ telemetry.ts         # telemetry/laps/compare query hook'ları
   │  └─ types.ts             # TÜM API response tipleri
   ├─ features/
   │  ├─ f1-telemetry/
   │  │  ├─ TrackMap.tsx           # tekli sim canvas
   │  │  ├─ CompareTrackMap.tsx    # ikili sim canvas
   │  │  ├─ TelemetryCharts.tsx    # speed/tb/gear/drs
   │  │  ├─ CompareCharts.tsx      # delta/speed/tb/gear
   │  │  ├─ TimingRibbon.tsx       # tur şeridi (tekli + ikili)
   │  │  ├─ SectorHeader.tsx
   │  │  ├─ SimControls.tsx        # step/play-pause + timer + legend
   │  │  ├─ useSimEngine.ts        # rAF simülasyon motoru (tekli)
   │  │  ├─ useCompareSimEngine.ts
   │  │  ├─ syncCursorPlugin.ts    # Chart.js plugin
   │  │  └─ useChartScrubber.ts
   │  └─ ac-live/
   │     ├─ AcDashboard.tsx        # dense grid layout
   │     ├─ Leaderboard.tsx
   │     ├─ GForceMeter.tsx
   │     ├─ SteeringWheel.tsx
   │     ├─ Pedals.tsx
   │     ├─ RpmLeds.tsx
   │     ├─ GearSpeedCluster.tsx
   │     ├─ DriverInfoBoard.tsx
   │     ├─ TyreGrid.tsx
   │     ├─ SystemLeds.tsx         # DRS/TC/ABS/PIT
   │     ├─ FuelDamage.tsx
   │     ├─ LiveTrackRadar.tsx     # kendini öğrenen pist canvas
   │     ├─ GarageOverlay.tsx
   │     ├─ FlagIndicator.tsx
   │     ├─ useAcSocket.ts
   │     ├─ useAcTrackLearning.ts  # localStorage cache mantığı
   │     └─ useCutDetector.ts      # teleport / geçersiz tur mantığı
   ├─ components/               # paylaşılan UI
   │  ├─ Breadcrumb.tsx
   │  ├─ CardGrid.tsx / Card.tsx
   │  ├─ StartLightsLoader.tsx  # F1 kalkış ışıkları overlay
   │  ├─ ThemeToggle.tsx
   │  ├─ LanguageFlags.tsx
   │  ├─ TeamColorBar.tsx
   │  ├─ TyreDot.tsx
   │  ├─ ImageWithFallback.tsx  # tek-seferlik guard'lı (döngüsüz)
   │  └─ ErrorState.tsx / EmptyState.tsx
   ├─ store/
   │  ├─ useUiStore.ts         # theme, language
   │  ├─ useCompareStore.ts    # driver1/driver2 seçim akışı
   │  └─ useSimStore.ts        # isPlaying, playhead, speed multiplier
   ├─ theme/
   │  ├─ tokens.css            # :root + [data-theme="light"] + prefers-color-scheme
   │  └─ ThemeProvider.tsx
   ├─ i18n/
   │  ├─ index.ts
   │  ├─ tr.json
   │  └─ en.json
   └─ lib/
      ├─ format.ts             # formatLapTime, formatDate, hexToRgb
      └─ trackImages.ts        # location -> png eşleşmesi (fallback için)
```

---

## 3. Tasarım sistemi & tema

### 3.1 Kimlik
- **F1 kırmızısı** ana renk (`#E10600` dark / `#D20000` light). Motor sporu enerjisi korunur.
- Display font **Titillium Web** (başlıklar, sayaçlar, "f1-font"), gövde **Montserrat / system-ui**.
- Koyu tema varsayılan; açık tema tam eşdeğer; ayrıca `prefers-color-scheme` ile sistem takibi.

### 3.2 Token seti (`theme/tokens.css`)
Mevcut değişkenler korunur + genişletilir. `:root` = açık tema (light-first tanım), `[data-theme="dark"]` ve `@media (prefers-color-scheme: dark)` ile koyu override.

```
--bg               (eski --bg-color)        arka plan
--surface-1        (eski --secondary-bg)    panel
--surface-2                                 iç panel / kart hover
--border           (eski --tag-border)
--text             (eski --text-color)
--text-muted                               ikincil metin
--primary          (eski --primary-color)   F1 kırmızısı
--accent           (eski --accent-color)
--positive         #00E676  (yeşil — PB, throttle, "d1 hızlı")
--negative         #FF1744  (kırmızı — fren, ceza, "d2 hızlı")
--warning          (eski --warning-color, sarı — geçersiz tur, "öğreniliyor")
--purple           #D500F9  (session-best sektör / fastest lap)
--info             #2979FF  (DRS)
--tag-bg / --tag-text                       (eski)
--progress-bg / --progress-shadow           (eski)
--track-filter / --track-filter-hover       (eski — pist görseli filtresi)
--driver-shadow / --retro-shadow / --board-bg (eski)
--radius-sm/md/lg/2xl                       4 / 8 / 12 / 20
--space-*                                   4px grid
--shadow-1/2/3
--team-color                               runtime'da inline set edilir (pilot rengi)
```

Not: tyre compound renkleri (`soft/medium/hard/intermediate/wet/unknown`) ayrı bir map (`--tyre-soft` vb.) veya sabit obje.

### 3.3 Modernizasyon dokunuşları (özellik değil, görsel dil)
- Yumuşak yüzeyler, `border-radius: var(--radius-2xl)`, ince `--shadow-*`, panellerde hafif iç kenar ışığı.
- Hareket **hızlı ve amaçlı** (150–350ms), `cubic-bezier(.22,1,.36,1)`; `prefers-reduced-motion` desteği.
- `:focus-visible` halkaları; ikon butonlarına `aria-label`.
- Renk tek başına anlam taşımasın: sektör/delta'da `+/-` işareti + ikon.
- Responsive: masaüstü öncelikli ama laptop→ultrawide arası akıcı. AC dashboard yoğun grid; dar ekranda `min-width` + yatay scroll kabul edilebilir.

---

## 4. Özellik envanteri — HEPSİ KORUNACAK

### 4.1 Genel / kabuk
- [ ] Ana ekran: **F1 / Assetto Corsa** mod seçimi, animasyonlu kartlar, logo, SVG "F1" ikonu
- [ ] **Tema toggle** (koyu/açık) — güneş/ay ikonlu slider; localStorage'da kalıcı; sistem varsayılanı
- [ ] **Dil bayrakları** (TR/EN) sağ üstte; aktif bayrak vurgusu; localStorage'da kalıcı
- [ ] **Breadcrumb** navigasyon: `Formula 1 / {yıl} / {yarış} / {seans} / {pilot}` — her segment tıklanınca o adıma döner (artık route ile)
- [ ] **F1 kalkış ışıkları** yükleme overlay'i: 5 ışıklı gantry, 2.2sn'de bir kırmızı sekans, veri gelince yeşil yanıp söner
- [ ] **Canlı i18n**: dil değişince tüm etiketler, ülke/yarış/seans/tur adları, grafik başlıkları + dataset label'ları, AC etiketleri yeniden çevrilir; `<html lang>` güncellenir

### 4.2 F1 modu — akış
- [ ] **Yıl seçimi**: kartlar (API'den `available_years`), azalan sıralı, cascade animasyon
- [ ] **Yarış seçimi**: kart başına round no, çevrili event adı, pist siluet görseli (**fallback'li, döngüsüz**), lokasyon+ülke (çevrili), tarih (`dd.mm.yyyy`)
- [ ] **Seans seçimi**: bento layout; ana seanslar (Race/Qualifying/Sprint) vs alt seanslar (Practice) ayrımı, ikon, çevrili ad, tarih
- [ ] **Pilot seçimi**: kart başına takım rengi barı, pilot kodu, pilot fotoğrafı (**fallback'li**), broadcast adı, takım adı (takım renginde). Compare modunda 1. pilot disabled + "SEÇİLİ PİLOT" rozeti

### 4.3 F1 — Tekli telemetri dashboard
- [ ] **Sol panel — pist haritası** (`<canvas>`), giriş pan/zoom animasyonu:
  - X/Y'den pist konturu
  - Hıza göre renklenen iz (hsl 0°→120°), takım rengi parlayan araç noktası, kesik çizgiyle bağlı yüzen pilot etiketi
  - Simülasyon **4× gerçek tur hızında**, sonsuz döngü
- [ ] **Sim kontrolleri**: geri adım / oynat-duraklat / ileri adım, sim sayacı (`m:ss.mmm`), Min/Max hız legend'ı
- [ ] **Sağ panel — dinamik sektör başlığı**: tur no, tur süresi, **"VS COMPARE"** butonu, S1/S2/S3 rozetleri renk kodlu (mor=session best, yeşil=personal best, sarı), lastik compound noktası + adı + lastik ömrü
- [ ] **Timing ribbon**: tüm turların yatay kaydırılabilir şeridi; kart başına compound renk çizgisi, tur no, tur süresi; PB vurgulu, aktif vurgulu; tıkla → o turu yükle; wheel ile yatay kaydırma
- [ ] **Grafikler (Chart.js)**:
  - Hız (line, takım rengi, fill, max/min "kritik" noktalar yeşil/kırmızı `rectRounded`, tooltip MAX/MIN, y 0–350)
  - Gaz/Fren (yeşil gaz fill + kırmızı fren stepped, y 0–105)
  - Vites (sarı stepped, y 0–9)
  - DRS (mavi stepped, y ekseni "Açık/Kapalı", lokalize tooltip)
  - **syncCursor plugin**: tüm grafiklerde simülasyon konumunu izleyen dikey kesik çizgi + interpolasyonlu renkli nokta
  - **Scrubber**: herhangi bir grafiğe tıkla/sürükle → simülasyonu o noktaya taşı; akıllı imleç (grab/grabbing/pointer)
- [ ] **Lap-by-lap**: ribbon'dan tur seç → yeni telemetri isteği (`lap={n}`); laps özeti pilot başına bellekte cache
- [ ] Tur açılışında **laps summary** ayrı istekle çekilir (yoksa), varsa beklemeden ribbon güncellenir

### 4.4 F1 — İkili karşılaştırma (Compare)
- [ ] "VS COMPARE" → pilot seçimine dön, 1. pilot kilitli → 2. pilotu seç → compare isteği
- [ ] Breadcrumb'da **ikili pilot etiketi** (renk1 | KOD1 | VS | KOD2 | renk2)
- [ ] Dashboard:
  - Sol: **ikili araç pist haritası**, iki araç ortak sabit-mesafe path üzerinde animasyon, 2. pilot kesik çizgi, iki yüzen etiket (çapraz offset, çakışmasın)
  - Başlık: `KOD1 (süre1) VS KOD2 (süre2)` + tur delta (renkli ±s)
  - **İkili timing ribbon**: bölünmüş compound çizgisi (d1 üst / d2 alt), tur no, tur başına süre farkı (kim hızlıysa onun renginde)
  - Delta grafiği (0 üstü = d1 yavaş → kırmızı dolgu, altı = d1 hızlı → yeşil dolgu, segment border rengi)
  - İkili hız grafiği (d1 düz, d2 kesik, legend açık)
  - İkili gaz/fren grafiği (4 dataset)
  - İkili vites grafiği (stepped, d1 düz / d2 kesik)
  - syncCursor + scrubber **mesafe alanında** çalışır
  - Sim = en yavaş turun 4×'i, döngü
  - `requestSpecificLapCompare` ile lap-by-lap compare

### 4.5 Assetto Corsa modu
- [ ] **Oda ekranı**: retro logo, "Oda Kodunu Giriniz", input (`TLM-#########`), "SİMÜLASYONA BAĞLAN", statü satırı; regex `^TLM-[A-Z0-9]{9}$`, geçersizde shake animasyon; geri butonu
- [ ] **Bağlantı**: oda kodu → WS aç → "BAĞLANTI KURULDU" → dashboard'a geçiş animasyonu
- [ ] **Dashboard (yoğun 3-kolon grid)**:
  - Üst bar: bağlantı LED'i, "ROOM: {kod}", POS, LAP, bayrak göstergesi, "AYRIL" butonu
  - **Sol**: canlı **leaderboard** (pos, ad, delta, süre; top3 + oyuncu±1; oyuncu satırı vurgulu; en hızlı tur vurgulu) · **G-force meter** (crosshair + nokta, Lat/Lon G) · **direksiyon SVG** (steer×180° döner, açı; 0°'de kırmızı) · **pedallar** (THR yeşil / BRK kırmızı bar)
  - **Merkez**: **RPM LED şeridi** (15 LED: 5 yeşil/5 kırmızı/5 mavi, rpm/8500) · RPM sayısı · **vites** (R/N/sayı, büyük) · **hız kümesi** (büyük sayı + km/h) · **pilot bilgi panosu** (DRIVER, CAR, TYRES [soft/medium/hard renk], CURRENT/LAST/BEST LAP [best: session fastest=mor, PB=yeşil, yoksa soluk], SECTOR, PENALTY)
  - **PENALTY mantığı**: geçersiz tur → "TUR İPTAL" (kırmızı, current time üstü çizili) · resmi ceza → "{n} CEZA" (sarı) · temiz → "0"
  - **Cut/teleport dedektörü**: `norm_pos` sıçraması + `tyres_out>=3 && speed>20 && !in_pit` → tur geçersiz; yeni tur/pit/menü → sıfırla
  - **Watchdog**: 2sn veri yok → garage overlay; menü modu tespiti (`speed==0 && rpm==0 && gear==0`)
  - **Sağ**: **lastik grid 2×2** (°C + psi, FL/FR/RL/RR) · **sistem LED'leri** (DRS/TC/ABS/PIT) · **yakıt** (L + dinamik bar, max otomatik tespit, <10% kırmızı / <25% sarı / mavi) · **hasar** (% + kırmızı bar)
  - **Canlı pist radarı** (`<canvas>`) — **kendini öğrenen pist**:
    - Araç id başına konum biriktir; bir araç turu tamamlayıp başlangıca yaklaşınca (>250 nokta) → pisti **kilitle**, `localStorage`'a kaydet (`ac_track_cache_{track}`)
    - Çizim: öğrenme heatmap'i (soluk) VEYA kilitli pist (dolu) + başlangıç işareti
    - Araç noktaları: oyuncu (kırmızı, büyük, glow, pozisyon etiketi), top3 (cyan), oyuncu±1 (sarı), diğerleri (yeşil küçük)
    - "HARİTA ÖĞRENİLİYOR..." / "HARİTA KİLİTLENDİ" HUD
    - "TRACK: {AD}" başlığı · **"HARİTAYI SIFIRLA"** butonu (path + localStorage temizler)
  - **Garage/Menu overlay**: ana grid blur, "GARAGE MODE / ENGINE OFF" · "MENU MODE" · "NO SIGNAL", çıkış butonu
  - **Bayraklar**: sarı (lb_data.yellow_flag), mavi/sarı/siyah/beyaz/damalı/ceza (t.flag) — renkli gösterge + lokalize metin
  - **Panel cascade animasyonu** garage'dan çıkışta
- [ ] **Ayrıl**: WS kapat → her şeyi sıfırla → ana menüye dön

---

## 5. API kontratı (backend hazır — referans)

Base URL: `VITE_API_BASE_URL` (dev: `http://127.0.0.1:8000`, prod: reverse-proxy ile same-origin `/api` önerilir — bkz. §8).
`{race_name}` = event adı (örn. `Bahrain Grand Prix`), path'te **`encodeURIComponent`**. `{session_type}` örn. `Q`, `R`, `Practice 1`. `{driver}` 3 harf kod.

| Method | Path | Yanıt (özet) | Rate limit |
|---|---|---|---|
| GET | `/api/v1/schedule/years` | `{ available_years: number[] }` | 60/dk |
| GET | `/api/v1/schedule/{year}/races` | `{ races: Race[] }` — `Race{ round_number, country, location, event_name, event_date, track_name, track_image }` | 60/dk |
| GET | `/api/v1/schedule/{year}/{race}/sessions` | `{ sessions: Session[] }` — `Session{ session_id, session_name, session_date }` | 60/dk |
| GET | `/api/v1/schedule/{year}/{race}/{session}/drivers` | `{ drivers: Driver[] }` — `Driver{ driver_code, broadcast_name, team_name, team_color }` | 60/dk |
| GET | `/api/v1/telemetry/{year}/{race}/{session}/{driver}?lap=fastest\|{n}` | `{ driver_code, track_name, lap_requested, data_points, telemetry_data: { time[], distance[], speed[], n_gear[], throttle[], brake[], drs[], x[], y[], lap_number, lap_time } }` | 30/dk |
| GET | `/api/v1/laps/{year}/{race}/{session}/{driver}` | `{ driver_code, session_type, total_laps, laps_data: Lap[] }` — `Lap{ lap_number, lap_time, sector_1..3, s1_color..s3_color ('purple'|'green'|'yellow'), compound, tyre_life, is_personal_best, is_pit_out, is_pit_in }` | 40/dk |
| GET | `/api/v1/compare/{year}/{race}/{session}/{d1}/{d2}?lap=fastest\|{n}` | `{ comparison_data: { fixed_distance[], delta_time[], laps_overview: [{ lap_number, d1_compound, d2_compound, d1_lap_time, d2_lap_time }], driver1: DriverCmp, driver2: DriverCmp } }` — `DriverCmp{ code, lap_time, speed[], throttle[], brake[], n_gear[], x[], y[], compound, tyre_life }` | 15/dk |
| GET | `/api/v1/active-rooms` | `{ active_rooms: string[] }` (son 5sn veri almış odalar) | — |
| WS | `/ws/live/{room_id}` | AC telemetri JSON text frame'leri; client `"PING"` yollar → `{"type":"PONG"}` alır | — |

Notlar:
- Hata durumunda API `4xx` + `{ detail: "..." }` döner. `client.ts` bunu normalize etsin; UI `ErrorState` göstersin (mevcut "…verisi bulunamadı" metinleri korunur).
- `?lap` yoksa `fastest`.
- `slowapi` limitleri artık **tarayıcı IP'si** başına (eskiden tek Delphi sunucu IP'siydi) — bu daha adil; ama compare 15/dk düşük, lap-by-lap compare'de dikkat.
- CORS: `allow_origins=["*"]` + `allow_credentials=True` spec'e aykırı ama credential göndermediğimiz için sorun değil. Same-origin proxy ile tamamen aşılır.

### 5.1 AC canlı telemetri frame'i (WS'ten gelen JSON — `updateACTelemetry`'nin okuduğu alanlar)

```
speed, rpm, gear, gas, brake, steer,
g_lat, g_lon, fuel, damage,
tyre_fl_t, tyre_fl_p, tyre_fr_t, tyre_fr_p, tyre_rl_t, tyre_rl_p, tyre_rr_t, tyre_rr_p,
drs (0/1), tc_action, abs_action, pit_limiter (0/1),
lap, pos, sector, norm_pos, tyres_out, penalty, in_pit (0/1), flag,
track_name, car_model, driver_name, driver_nick,
cur_time, last_time, best_time, tyre_comp,
lb_data: { leaderboard: [{ pos, name, delta, time, is_player, is_fastest, id }], player_pos, yellow_flag },
map_data: { map: [[id, x, z], ...] }
```

Tüm bu alanlar için `src/features/ac-live` içinde bir `AcFrame` TypeScript tipi tanımlanacak.

---

## 6. Routing & navigasyon

React Router v6, URL akışı = ekran akışı:

| Route | Ekran | Veri |
|---|---|---|
| `/` | Mod seçimi | — |
| `/f1` | Yıl seçimi | `useYears()` |
| `/f1/:year` | Yarış seçimi | `useRaces(year)` |
| `/f1/:year/:race` | Seans seçimi | `useSessions(year, race)` |
| `/f1/:year/:race/:session` | Pilot seçimi | `useDrivers(year, race, session)` |
| `/f1/:year/:race/:session/:driver` | Tekli telemetri | `useTelemetry(...)` + `useLaps(...)` |
| `/f1/:year/:race/:session/:driver?lap=12` | Belirli tur | aynı, `lap` query |
| `/f1/:year/:race/:session/compare/:d1/:d2` | İkili karşılaştırma | `useCompare(...)` |
| `/ac` | AC oda girişi | — |
| `/ac/:room` | AC canlı dashboard | `useAcSocket(room)` |

Kazanç: Breadcrumb tamamen `<Link>`'lerden türetilir; tarayıcı geri tuşu doğru çalışır; her ekran paylaşılabilir/bookmark'lanabilir; **aynı route iki kez yüklense bile React Query dedupe eder** (mevcut çift-render bug'ı yapısal olarak imkânsız).

---

## 7. State & veri yönetimi

| Durum | Nerede | Not |
|---|---|---|
| API verisi (years, races, telemetry, compare, laps…) | **React Query** | `queryKey` = endpoint + parametreler; `staleTime`: schedule ~1 saat, telemetry/compare/laps ~gün (geçmiş veri değişmez); `retry: 1` |
| Tema | Zustand + `localStorage` (`tlm_theme`) | `<html data-theme>` |
| Dil | Zustand + `localStorage` (`tlm_lang`) + i18next | `<html lang>` |
| Compare seçim akışı | Zustand (`useCompareStore`) | `driver1Meta`, `mode: 'idle'|'picking-d2'` |
| Simülasyon oynatma | Zustand (`useSimStore`) | `isPlaying`, `playheadSeconds` (veya mesafe), `speedMultiplier=4` — scrubber & step bunu değiştirir; canvas & syncCursor bunu okur |
| Aktif takım rengi | route state / query verisinden türetilir | `--team-color` CSS var inline |
| AC son frame | `useAcSocket` local state (ref + `useSyncExternalStore`) | 30–60fps geldiği için render throttle (`requestAnimationFrame` ile) |
| AC öğrenilen pist | `localStorage` (`ac_track_cache_{track}`) | mevcut format korunur |

**Önemli**: AC WS'i saniyede onlarca frame gönderiyor. Her frame'de React re-render pahalı olur. Çözüm: frame'i bir `ref`'e yaz, `requestAnimationFrame` içinde canvas'ları imperatif çiz, sayısal göstergeleri de rAF-throttle'lı bir `useAcFrame()` hook'uyla ~10–15fps güncelle. (Mevcut kod zaten Delphi timer'ıyla ~5fps'e indiriyordu — o davranış korunur/iyileştirilir.)

---

## 8. Build & deploy

```bash
cd telemetria-web
npm install
npm run dev        # http://localhost:5173, VITE_API_BASE_URL=http://127.0.0.1:8000
npm run build      # -> dist/  (static)
npm run preview
```

`.env` / `.env.production`:
```
VITE_API_BASE_URL=/api          # prod: same-origin proxy (önerilen)
VITE_WS_BASE_URL=/ws            # veya wss://api.yusa.app
```

### Deployment seçenekleri (öneri sırası)

1. **nginx — static + reverse proxy (ÖNERİLEN)**
   `dist/` static olarak sunulur; `/api` ve `/ws` uvicorn'a proxy'lenir. Böylece:
   - Mixed content sorunu yok (her şey `https://yusa.app` altında)
   - CORS tamamen devre dışı kalır (same-origin)
   - WebSocket `wss://yusa.app/ws/live/...` temiz çalışır
   ```nginx
   location / { root /var/www/telemetria-web/dist; try_files $uri /index.html; }
   location /api/ { proxy_pass http://127.0.0.1:8000/api/; }
   location /ws/  { proxy_pass http://127.0.0.1:8000/ws/;
                    proxy_http_version 1.1;
                    proxy_set_header Upgrade $http_upgrade;
                    proxy_set_header Connection "upgrade"; }
   ```
2. **IIS static site** + ARR ile `/api` & `/ws` reverse proxy (mevcut sunucu Windows/NSSM ise doğal geçiş).
3. **Vercel / Netlify / Cloudflare Pages** — sadece API `https://api.yusa.app` olarak public TLS ile expose edilirse. WS için `wss://`.

**Kritik**: React SPA `https` üzerinden sunulacaksa API de **`https` + `wss`** olmalı (tarayıcı `http`/`ws` karışık içeriği bloklar). Bu yüzden 1. seçenek (same-origin proxy) en az sürtünmeli.

**Not**: Delphi/uniGUI/IIS-ISAPI tarafı tamamen emekliye ayrılır. `telemetria-client/` repo'su arşiv olarak kalır.

---

## 9. Migrasyon — fazlar (sonraki session'da uygulanacak)

**Faz 0 — İskele**
- Vite + React + TS projesi, ESLint/Prettier, klasör yapısı
- `theme/tokens.css` (mevcut `telemetria_css.css` değişkenlerini port et + genişlet), `ThemeProvider`, `ThemeToggle`
- i18n kur, `telemetria_i18n.js` → `tr.json` / `en.json`
- `api/client.ts` + `api/types.ts` (tüm response tipleri), React Query provider
- Router iskeleti + `Breadcrumb`
- `StartLightsLoader`, `ImageWithFallback` (döngüsüz), `CardGrid`/`Card`, `EmptyState`/`ErrorState`

**Faz 1 — F1 navigasyon**
- Years / Races / Sessions / Drivers route'ları + query hook'ları + kart animasyonları (Framer Motion cascade)
- `lib/format.ts`, `lib/trackImages.ts`
- Compare seçim akışı (`useCompareStore`, driver kilidi)

**Faz 2 — F1 tekli telemetri**
- `TelemetryCharts` (Chart.js 4) + `syncCursorPlugin` port
- `TrackMap` canvas + `useSimEngine` (rAF, 4× hız, döngü, hız-renkli iz, yüzen etiket)
- `SimControls` + `useSimStore` + `useChartScrubber`
- `SectorHeader` + `TimingRibbon` + `useLaps` + lap-by-lap

**Faz 3 — F1 compare**
- `CompareCharts` (delta/speed/tb/gear), `CompareTrackMap` + `useCompareSimEngine`
- İkili ribbon, ikili breadcrumb tag'i, `requestSpecificLapCompare`

**Faz 4 — AC canlı**
- `useAcSocket` (native WS + reconnect + PING + rAF throttle)
- Oda ekranı + validasyon + shake
- `AcDashboard` grid + tüm alt bileşenler (Leaderboard, GForce, Steering, Pedals, RpmLeds, GearSpeed, DriverInfo, TyreGrid, SystemLeds, FuelDamage)
- `LiveTrackRadar` + `useAcTrackLearning` (localStorage cache) + `useCutDetector` + `GarageOverlay` + `FlagIndicator` + watchdog + cascade

**Faz 5 — Cila & deploy**
- Responsive geçişler, `prefers-reduced-motion`, a11y (focus, aria-label, kontrast)
- Yerel asset'ler (`public/assets/` — track/driver placeholder, logo)
- nginx config, env dosyaları, prod build testi
- Eski client'ı arşivle

---

## 10. Riskler & açık sorular

| Konu | Not / karar gerek |
|---|---|
| **Asset barındırma** | `yusa.app/assets/tracks/*.png`, `.../drivers/*.png`, logo, `telemetria_text_{tr,en}.png` — bu klasör **yok**. Ya bu görseller `telemetria-web/public/assets/`'e konur (bundle) ya da bir CDN/klasör kurulur. Karar: yerel bundle + eksikte gömülü SVG placeholder |
| **`fa-car-formula` ikonu** | FA6 Pro olabilir — lucide/özel SVG ile değiştir |
| **HTTPS/WSS** | Prod'da API `https`+`wss` olmalı; same-origin nginx proxy en temizi |
| **Compare rate limit (15/dk)** | Lap-by-lap compare'de kullanıcı hızlı tıklarsa 429 — debounce + React Query dedupe + "lütfen bekleyin" |
| **AC frame hızı** | rAF throttle şart; aksi halde React boğulur |
| **`race_name` = event adı** | Tüm alt isteklerde `event_name` kullanılır (location değil); `encodeURIComponent` |
| **AC `map_data` koordinat sistemi** | Mevcut kod `x` eksenini ters çeviriyor (`-car[1]`), `z`'yi düz alıyor — birebir korunacak |
| **Chart.js vs performans** | ~120–400 nokta/grafik, compare'de 4 dataset — Chart.js 4 yeterli. Sorun olursa `uPlot`'a geçiş opsiyonel |
| **Tema geçişinde grafik renkleri** | Mevcut `setTheme` grafikleri manuel günceller — React'te `useEffect([theme])` ile chart options patch |
| **i18n derinliği** | `countries` / `events` / `sessions` / `laps` nested map'leri aynen taşınacak (yarış/ülke adı çevirileri) |

---

## 11. Özet

- **Backend'e dokunulmaz.** React client doğrudan REST + WS ile konuşur.
- Delphi/uniGUI aracı katmanı, onunla gelen **tüm** yapısal buglar (bloklama, timeout, çift-tetikleme, görsel döngüsü, derleme döngüsü) ortadan kalkar.
- Mevcut **her özellik** (yukarıdaki §4 envanteri) birebir korunur.
- Modern token tabanlı tasarım sistemi, tam açık/koyu tema, `prefers-color-scheme`, a11y, `prefers-reduced-motion`.
- TanStack Query + React Router, dedupe/cache/retry ve URL-driven navigasyon işi baştan doğru yapar.
- Deploy: `vite build` → static `dist/` + nginx same-origin reverse proxy (`/api`, `/ws`).
