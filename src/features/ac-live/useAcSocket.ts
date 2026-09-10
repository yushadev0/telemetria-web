/* ==========================================================================
   useAcSocket — Assetto Corsa canlı telemetri WebSocket'i
   - native WebSocket, backoff'lu otomatik reconnect
   - her ~10 sn düz metin "PING" → sunucu `{"type":"PONG"}` döner (yutulur)
   - kaynak ~20 fps (Delphi Timer 50 ms); frame'i doğrudan state'e yazıyoruz,
     rAF throttle gerekmez (basit metin ağacı bu hızı taşır)
   - watchdog: >2 sn frame yoksa `stale`
   - cut/teleport dedektörü + yakıt max tespiti + best-lap tonu her ham
     frame'de state makinesiyle hesaplanır (legacy updateACTelemetry ile birebir)
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';
import type { AcFrame } from '@/api/types';
import { buildWsUrl } from '@/api/client';
import { clamp } from './acUtils';

export type WsStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface AcDerived {
  /** speed=rpm=gear=0 → oyun menüsü / garaj. */
  isMenu: boolean;
  /** Cut dedektörü: tur geçersiz (4+ teker dışarı, pit dışı, hız > 20). */
  lapInvalid: boolean;
  /** Yakıt yüzdesi (otomatik tespit edilen max'a göre). */
  fuelPct: number;
  maxFuel: number;
  /** En iyi tur tonu: session-best (mor) / personal-best (yeşil) / yok. */
  bestTone: 'sb' | 'pb' | 'none';
}

interface StateMachine {
  lastSpline: number | null;
  lastLapCount: number | null;
  lapInvalid: boolean;
  maxFuel: number;
  fuelSet: boolean;
}

const PING_INTERVAL_MS = 10_000;
const WATCHDOG_MS = 2_000;
const RECONNECT_MAX_MS = 8_000;

function freshStateMachine(): StateMachine {
  return {
    lastSpline: null,
    lastLapCount: null,
    lapInvalid: false,
    maxFuel: 0,
    fuelSet: false,
  };
}

function computeDerived(sm: StateMachine, f: AcFrame): AcDerived {
  const isMenu = f.speed === 0 && f.rpm === 0 && f.gear === 0;

  const prev = sm.lastSpline;
  const diff = prev === null ? 0 : Math.abs(f.norm_pos - prev);
  const teleported =
    sm.lastLapCount === f.lap && diff > 0.2 && diff < 0.8 && f.speed < 10;
  sm.lastSpline = f.norm_pos;

  // Temiz sayfa: yeni tur / pit / ışınlanma / menü → cezaları sıfırla
  if (sm.lastLapCount !== f.lap || f.in_pit === 1 || teleported || isMenu) {
    sm.lastLapCount = f.lap;
    sm.lapInvalid = false;
  }
  // Acımasız kesici: 4+ teker çimde, pit dışı, gerçek hızda → tur yandı
  if (f.tyres_out >= 3 && f.in_pit === 0 && f.speed > 20) {
    sm.lapInvalid = true;
  }

  if (!sm.fuelSet && f.fuel > 0) {
    sm.maxFuel = f.fuel;
    sm.fuelSet = true;
  }
  if (f.fuel > sm.maxFuel) sm.maxFuel = f.fuel;
  const fuelPct = sm.maxFuel > 0 ? clamp((f.fuel / sm.maxFuel) * 100, 0, 100) : 0;

  const playerRow = f.lb_data?.leaderboard?.find((r) => r.is_player);
  let bestTone: AcDerived['bestTone'] = 'none';
  if (playerRow?.is_fastest) {
    bestTone = 'sb';
  } else if (playerRow && f.best_time && f.best_time !== '0:00.000' && f.best_time !== '0') {
    bestTone = 'pb';
  }

  return { isMenu, lapInvalid: sm.lapInvalid, fuelPct, maxFuel: sm.maxFuel, bestTone };
}

export interface AcSocket {
  status: WsStatus;
  frame: AcFrame | null;
  derived: AcDerived | null;
  /** İlk frame geldikten sonra >2 sn sessizlik. */
  stale: boolean;
}

export function useAcSocket(room: string | undefined): AcSocket {
  const [status, setStatus] = useState<WsStatus>('connecting');
  const [frame, setFrame] = useState<AcFrame | null>(null);
  const [derived, setDerived] = useState<AcDerived | null>(null);
  const [stale, setStale] = useState(false);

  const lastFrameAtRef = useRef(0);
  const smRef = useRef<StateMachine>(freshStateMachine());

  useEffect(() => {
    if (!room) return;

    smRef.current = freshStateMachine();
    lastFrameAtRef.current = 0;
    setFrame(null);
    setDerived(null);
    setStale(false);
    setStatus('connecting');

    const url = buildWsUrl(`/ws/live/${encodeURIComponent(room)}`);

    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let disposed = false;

    const clearPing = (): void => {
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
    };

    const connect = (): void => {
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (disposed) return;
        attempt = 0;
        setStatus('open');
        pingTimer = setInterval(() => {
          try {
            ws?.send('PING');
          } catch {
            /* yut — close olayı reconnect'i tetikler */
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (ev: MessageEvent) => {
        if (disposed) return;
        let data: unknown;
        try {
          data = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
        } catch {
          return;
        }
        if (!data || typeof data !== 'object') return;
        if ((data as { type?: string }).type === 'PONG') return;

        const f = data as AcFrame;
        lastFrameAtRef.current = Date.now();
        setStale(false);
        setFrame(f);
        setDerived(computeDerived(smRef.current, f));
      };

      ws.onerror = () => {
        /* onclose zaten reconnect planlıyor */
      };

      ws.onclose = () => {
        if (disposed) return;
        clearPing();
        attempt += 1;
        const delay = Math.min(1000 * 2 ** (attempt - 1), RECONNECT_MAX_MS);
        setStatus('reconnecting');
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    const watchdog = setInterval(() => {
      if (lastFrameAtRef.current === 0) return;
      setStale(Date.now() - lastFrameAtRef.current > WATCHDOG_MS);
    }, 500);

    return () => {
      disposed = true;
      clearInterval(watchdog);
      clearPing();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
      }
    };
  }, [room]);

  return { status, frame, derived, stale };
}
