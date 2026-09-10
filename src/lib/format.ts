/* ==========================================================================
   Biçimlendirme yardımcıları
   Port: telemetria-client/.../script.js → window.formatLapTime
   ========================================================================== */

/**
 * Saniye cinsinden ham tur süresini `m:ss.mmm` biçimine sokar.
 * null / undefined / '' / 'null' → `naLabel` (i18n unknownWord).
 * Zaten formatlı string gelirse aynen döndürür.
 */
export function formatLapTime(raw: number | string | null | undefined, naLabel = 'N/A'): string {
  if (raw === null || raw === undefined || raw === '' || raw === 'null') return naLabel;

  const num = typeof raw === 'number' ? raw : Number.parseFloat(raw);
  if (Number.isNaN(num)) return String(raw);

  const totalSeconds = num;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/** Delta süre: işaretli `±s.mmm` (renk/işaret çağıran tarafta). */
export function formatDelta(seconds: number | null | undefined, naLabel = 'N/A'): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return naLabel;
  const sign = seconds > 0 ? '+' : seconds < 0 ? '−' : '';
  return `${sign}${Math.abs(seconds).toFixed(3)}s`;
}

/** ISO "YYYY-MM-DD" (veya datetime) → "dd.mm.yyyy". Parse edilemezse ham değer. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const datePart = iso.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return iso;
  const [, y, m, d] = match;
  return `${d}.${m}.${y}`;
}

/** "#1E5BC6" | "1E5BC6" → "#1e5bc6". Boş/geçersizse null. */
export function normalizeHexColor(hex: string | null | undefined): string | null {
  if (!hex) return null;
  const trimmed = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed) && !/^[0-9a-fA-F]{3}$/.test(trimmed)) return null;
  return `#${trimmed.toLowerCase()}`;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Hex → {r,g,b}. Geçersizse null. */
export function hexToRgb(hex: string | null | undefined): Rgb | null {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  let body = normalized.slice(1);
  if (body.length === 3) {
    body = body
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return {
    r: Number.parseInt(body.slice(0, 2), 16),
    g: Number.parseInt(body.slice(2, 4), 16),
    b: Number.parseInt(body.slice(4, 6), 16),
  };
}

/** `rgba(r, g, b, a)` string üretir. */
export function rgba(hex: string, alpha: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}
