/* ==========================================================================
   Assetto Corsa canlı modu — saf yardımcılar
   Davranış referansı: telemetria-client/Win32/Debug/files/script.js
   (updateACTelemetry). Görsel değil, mantık birebir korunur.
   ========================================================================== */

import type { AcFrame, AcLeaderboardEntry } from '@/api/types';

export const RPM_MAX = 8500;
export const RPM_LED_COUNT = 15;
/** G-force çemberinde ±3G kenara denk gelir (legacy gLimit). */
export const G_LIMIT = 3.0;

export const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(n, hi));

/** Vites sayısı → etiket. AC: -1 = geri, 0 = boş. */
export function gearLabel(gear: number): string {
  if (gear === -1) return 'R';
  if (gear === 0) return 'N';
  return String(gear);
}

/** rpm → kaç LED yanacak (0..15). */
export function rpmLedCount(rpm: number): number {
  return Math.floor(clamp(rpm / RPM_MAX, 0, 1) * RPM_LED_COUNT);
}

/** LED sırası (1-based) → renk grubu: 5 yeşil / 5 kırmızı / 5 mavi. */
export function rpmLedTone(index: number): 'green' | 'red' | 'blue' {
  if (index <= 5) return 'green';
  if (index <= 10) return 'red';
  return 'blue';
}

export type CompoundTone = 'soft' | 'medium' | 'hard' | 'unknown';

export function compoundTone(comp: string | undefined | null): CompoundTone {
  const c = (comp ?? '').toLowerCase();
  if (c.includes('soft')) return 'soft';
  if (c.includes('medium')) return 'medium';
  if (c.includes('hard')) return 'hard';
  return 'unknown';
}

export const compoundColorVar: Record<CompoundTone, string> = {
  soft: 'var(--tyre-soft)',
  medium: 'var(--tyre-medium)',
  hard: 'var(--tyre-hard)',
  unknown: 'var(--text-faint)',
};

/** Yakıt bar rengi: <%10 kırmızı, <%25 sarı, yoksa mavi (legacy). */
export function fuelBarColor(pct: number): string {
  if (pct < 10) return 'var(--neg)';
  if (pct < 25) return 'var(--warn)';
  return 'var(--tyre-wet)';
}

/** Lastik çekirdek sıcaklığına göre kaba renk (AC slick penceresi ~70–100°C). */
export function tyreTempColor(tempC: number): string {
  if (tempC < 60) return 'var(--tyre-wet)';
  if (tempC <= 100) return 'var(--pos)';
  if (tempC <= 115) return 'var(--warn)';
  return 'var(--neg)';
}

export type FlagTone = 'none' | 'yellow' | 'blue' | 'black' | 'white' | 'checkered';

export interface FlagInfo {
  tone: FlagTone;
  /** i18n anahtarı. */
  key: string;
}

/** Bayrak: önce lb_data.yellow_flag, sonra frame.flag (sayı ya da AC_*_FLAG). */
export function flagInfo(frame: AcFrame): FlagInfo {
  if (frame.lb_data?.yellow_flag === true) return { tone: 'yellow', key: 'ac_flag_yellow' };

  const raw = frame.flag;
  if (raw === undefined || raw === null || raw === '') return { tone: 'none', key: 'ac_no_flag' };

  const v = String(raw).toUpperCase().replace('AC_', '').replace('_FLAG', '');
  switch (v) {
    case '1':
    case 'BLUE':
      return { tone: 'blue', key: 'ac_flag_blue' };
    case '2':
    case 'YELLOW':
      return { tone: 'yellow', key: 'ac_flag_yellow' };
    case '3':
    case 'BLACK':
      return { tone: 'black', key: 'ac_flag_black' };
    case '4':
    case 'WHITE':
      return { tone: 'white', key: 'ac_flag_white' };
    case '5':
    case 'CHECKERED':
      return { tone: 'checkered', key: 'ac_flag_checkered' };
    case '6':
    case 'PENALTY':
      return { tone: 'black', key: 'ac_penalty' };
    default:
      return { tone: 'none', key: 'ac_no_flag' };
  }
}

/** Leaderboard'da görünecek satırlar: ilk 3 + oyuncu ve komşuları (±1). */
export function visibleLeaderboardRows(
  entries: AcLeaderboardEntry[],
  playerPos: number,
): AcLeaderboardEntry[] {
  return entries.filter(
    (r) => r.pos <= 3 || r.pos === playerPos - 1 || r.pos === playerPos || r.pos === playerPos + 1,
  );
}

/** Oda kodu biçimi — Delphi `GenerateRoomCode` ile birebir. */
export const ROOM_CODE_RE = /^TLM-[A-Z0-9]{9}$/;

/** Dashboard görüntü modu — overlay/cascade bunun üstünden sürülür. */
export type AcMode = 'connecting' | 'live' | 'menu' | 'nosignal' | 'closed';
