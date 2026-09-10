# telemetria-web

Delphi/uniGUI tabanlı eski client'ın yerine geçen **React + Vite + TypeScript** web client'ı.
Plan ve gerekçe: [`new-client.md`](./new-client.md). Backend (`telemetria-api`) hazır ve değişmeyecek —
tarayıcı doğrudan REST + native WebSocket ile konuşur.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/ (static)
npm run preview
npm run lint
npm run typecheck
```

`.env` (dev) **canlı API'yi** hedefler (`https://yusa.app/telemetria`); lokal backend gerekmez.
`.env.production` boş taban ile same-origin nginx reverse-proxy senaryosunu varsayar (`/api`, `/ws`).
Örnek: [`.env.example`](./.env.example).

## Deploy

Static build, nginx altında `/telemetria/` alt-yolundan sunulur; API + WebSocket
ayrı `telemetria-api` (Docker) servisine reverse-proxy'lenir. İlk kurulum (nginx
location bloğu) ve sonraki her sürüm için tek komut:

```bash
./scripts/deploy.sh          # git pull → npm ci && build → rsync dist/ → doğrula
```

Ayrıntılar: **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## Tasarım yönü — "Pit Wall"

Eski Delphi client görünümünün portu **değil**; bilinçli yeniden tasarım. Timing-monitor / yarış
mühendisi ekranı dili: yoğun, tabular, hairline ızgara, keskin köşeler. **IBM Plex Mono** ana ses,
**IBM Plex Sans** uzun metin. Nötr-liderli palet (near-black `#0A0A0B` / beyaz); F1 kırmızısı
`#E10600` yalnız *sinyal* (aktif satır, canlı nokta, uyarı, birincil eylem). Ana ekran = iki tam
yükseklik "grid slot" paneli. Hareket minimum. Detay: `src/theme/tokens.css`.

## Durum — Faz 0 + Faz 1 tamamlandı (sıradaki: Faz 2)

`new-client.md §9`'daki faz planına göre:

| Alan | Durum |
|---|---|
| Vite + React + TS, ESLint/Prettier, klasör yapısı | ✅ |
| "Pit Wall" tasarım sistemi: `theme/tokens.css` + `ThemeProvider` + `ThemeToggle` (AUTO/☀/☾, `prefers-color-scheme`, localStorage) | ✅ |
| `Masthead` (kalıcı) + `SubBar` (route başına breadcrumb) + `LanguagePicker` (TR\|EN) | ✅ |
| Dil değiştirme **"decode" animasyonu** — yusa.app'ten taşındı (`lib/textMorph.ts` + `hooks/useLanguageMorph.tsx`); görünür metin yaprakları karışıp yeni dile kilitlenir. `data-no-morph` ile hariç tutma. | ✅ |
| i18n (`i18next`), `tr.json` / `en.json` — nested `countries`/`events`/`sessions`/`laps` korundu | ✅ |
| `api/client.ts` (fetch wrapper, hata normalize), `api/types.ts` (tüm REST tipleri + `AcFrame`), React Query provider | ✅ |
| `api/schedule.ts` + `api/telemetry.ts` query hook'ları | ✅ |
| Router iskeleti (`§6` URL akışı) + `Breadcrumb` | ✅ |
| `StartLightsLoader` (5 ışık, döngüsüz), `ImageWithFallback` (guard'lı), `CardGrid`/`Card` (timing satırı), `EmptyState`/`ErrorState` | ✅ |
| `lib/format.ts` (`formatLapTime` vb.), `lib/trackImages.ts` | ✅ |
| **`/f1` sezon seçimi** — canlı API'ye bağlı, light+dark uçtan uca doğrulandı | ✅ |

### Faz 1 — F1 navigasyon ✅

| | |
|---|---|
| `RacesRoute` — **bento ızgara** + cascade skew-slide giriş (`Tile`); round no, çevrili event adı, pist silueti (`ImageWithFallback` + `--track-filter`, hover'da büyür), lokasyon+ülke, tarih | ✅ |
| `SessionsRoute` — liste; ana seanslar / antrenmanlar gruplu, ana grup sırası **Yarış → Sprint → Sprint Sıralama → Sıralama** | ✅ |
| `DriversRoute` — **bento ızgara** + cascade; sol üst köşe pilot kodu (takım renginde) + takım rengi çizgisi, fotoğraf (fallback'li, hover'da büyür), takım rengi accent çizgisi, **pilot tam adı (düz renk)**, takım adı (dim) | ✅ |
| `Tile` + `CardGrid layout="bento"` — hairline kenarlı, gölgesiz kart ızgarası; `min(index,14)*45ms` stagger | ✅ |
| **URL slug'ları** — `%20` yok. `lib/slug.ts`: `slugify` ("bahrain-grand-prix"), `findBySlug` cache'li `useRaces`/`useSessions`'tan gerçek adı geri çözer, `prettifySlug` geçici görüntü için | ✅ |
| Compare seçim akışı — `useCompareStore` + `?vs=CODE` URL param'ı: kilitli 1. pilot + "SEÇİLİ PİLOT" rozeti → `/compare/:d1/:d2` | ✅ |
| Ortak kabuk `DataScreen` (SubBar + kalkış ışıkları + hata/boş/içerik dallanması) | ✅ |

Telemetry / Compare dashboard'ları ve AC ekranları hâlâ `PhasePlaceholder` (Faz 2–4).
Compare akışına geçici giriş: FAZ 2 telemetri iskelesindeki "VS KIYASLA →" linki.

> **API:** `telemetria-api` drivers endpoint'i `full_name`/`first_name`/`last_name` +
> `TEAM_COLOR_FALLBACK` ile güncellendi (commit `a31cb8b`), **canlıya deploy edildi**.
> Deploy: `git push` → sunucuda `update.bat` → `clear_redis_cache.bat`.

### Sıradaki: Faz 2 — tekli telemetri

`/f1/:year/:race/:session/:driver` iskelesinin yerine: `TrackMap` canvas + `useSimEngine`
(rAF, 4× tur hızı, döngü), `TelemetryCharts` (Chart.js 4) + `syncCursorPlugin` +
`useChartScrubber`, `SectorHeader` + `TimingRibbon` + `useLaps` + lap-by-lap.
Hook'lar hazır: `useTelemetry`, `useLaps` (`api/telemetry.ts`).

## Yapı

`new-client.md §2` klasör planına uyar. Öne çıkanlar:

```
src/
  api/        client.ts · types.ts · queryClient.ts · schedule.ts · telemetry.ts
  components/  AppShell · Masthead · SubBar · Breadcrumb · Card(Grid)
               StartLightsLoader · ThemeToggle · LanguagePicker · Segmented
               ImageWithFallback · Error/EmptyState
  hooks/      useLanguageMorph (dil "decode" animasyonu)
  i18n/        index.ts · tr.json · en.json
  routes/      HomeRoute · f1/* · ac/* · PhasePlaceholder
  store/       useUiStore (tema + dil)
  theme/       tokens.css · ThemeProvider
  lib/         format.ts · trackImages.ts · textMorph.ts
```
