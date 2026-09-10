/* ==========================================================================
   LiveTrackRadar — kendini öğrenen canlı pist radarı (canvas)
   Legacy: script.js updateACTelemetry §10. x ekseni TERS (`-car[1]`),
   z ekseni düz. Bir araç >250 nokta biriktirip başlangıca <40 birim
   yaklaşınca pist kilitlenir ve localStorage'a yazılır.
   ========================================================================== */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AcFrame } from '@/api/types';
import { hexToRgb } from '@/lib/format';
import type { AcMode } from './acUtils';
import styles from './radar.module.css';

interface Pt {
  x: number;
  z: number;
}

const MOVE_MIN = 10;
const PATH_CAP = 2500;
const LOCK_MIN_POINTS = 250;
const LOCK_NEAR = 40;

const cacheKey = (track: string): string => `ac_track_cache_${track.toLowerCase()}`;

export const LiveTrackRadar = memo(function LiveTrackRadar({
  frame,
  mode,
}: {
  frame: AcFrame | null;
  mode: AcMode;
}) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pathsRef = useRef<Map<string, Pt[]>>(new Map());
  const cachedRef = useRef<Pt[] | null>(null);
  const trackRef = useRef('');
  const prevModeRef = useRef<AcMode>(mode);
  const [locked, setLocked] = useState(false);

  const resetMap = useCallback((clearCache: boolean) => {
    pathsRef.current = new Map();
    if (clearCache && trackRef.current) {
      try {
        localStorage.removeItem(cacheKey(trackRef.current));
      } catch {
        /* yut */
      }
      cachedRef.current = null;
      setLocked(false);
    }
    const c = canvasRef.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  }, []);

  // garaj/menü/sinyal-yok → canlı: canlı izleri temizle (kilitli cache kalır)
  useEffect(() => {
    if (prevModeRef.current !== 'live' && mode === 'live') {
      pathsRef.current = new Map();
    }
    prevModeRef.current = mode;
  }, [mode]);

  // pist adı değişimi: izleri sıfırla + cache yükle
  const trackName = frame?.track_name;
  useEffect(() => {
    const name = trackName?.trim();
    if (!name) return;
    const code = name.toLowerCase();
    if (trackRef.current === code) return;
    trackRef.current = code;
    pathsRef.current = new Map();
    let cached: Pt[] | null = null;
    try {
      const raw = localStorage.getItem(cacheKey(code));
      if (raw) cached = JSON.parse(raw) as Pt[];
    } catch {
      /* yut */
    }
    cachedRef.current = cached;
    setLocked(Boolean(cached));
  }, [trackName]);

  // her frame: iz biriktir + çiz
  useEffect(() => {
    const canvas = canvasRef.current;
    const map = frame?.map_data?.map;
    if (!canvas || !map || map.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (W === 0 || H === 0) return;
    const bw = Math.round(W * dpr);
    const bh = Math.round(H * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ---- iz biriktir + kilit kontrolü ----
    const paths = pathsRef.current;
    let justLocked = false;
    for (const car of map) {
      const id = String(car[0]);
      const px = -Number(car[1]);
      const pz = Number(car[2]);
      let path = paths.get(id);
      if (!path) {
        path = [];
        paths.set(id, path);
      }
      const last = path.length > 0 ? path[path.length - 1] : null;
      if (!last || Math.hypot(px - last.x, pz - last.z) > MOVE_MIN) {
        path.push({ x: px, z: pz });
        if (path.length > PATH_CAP) path.shift();
      }
      if (!cachedRef.current && !justLocked && path.length > LOCK_MIN_POINTS) {
        const start = path[0];
        if (Math.hypot(px - start.x, pz - start.z) < LOCK_NEAR) {
          const snap = path.slice();
          cachedRef.current = snap;
          justLocked = true;
          try {
            localStorage.setItem(cacheKey(trackRef.current), JSON.stringify(snap));
          } catch {
            /* yut */
          }
        }
      }
    }
    if (justLocked) setLocked(true);

    // ---- sınırlar ----
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    const extend = (x: number, z: number): void => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    };
    const source = cachedRef.current ? [cachedRef.current] : Array.from(paths.values());
    for (const p of source) for (const pt of p) extend(pt.x, pt.z);
    for (const car of map) extend(-Number(car[1]), Number(car[2]));
    if (!Number.isFinite(minX)) return;

    if (maxX - minX < 50) {
      minX -= 150;
      maxX += 150;
    }
    if (maxZ - minZ < 50) {
      minZ -= 150;
      maxZ += 150;
    }
    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const scale = Math.min((W - 60) / rangeX, (H - 80) / rangeZ);
    const offX = (W - rangeX * scale) / 2 - minX * scale;
    const offZ = (H - rangeZ * scale) / 2 - minZ * scale + 10;
    const toX = (x: number): number => x * scale + offX;
    const toY = (z: number): number => H - (z * scale + offZ);

    // ---- tema renkleri ----
    const cs = getComputedStyle(canvas);
    const rgb = hexToRgb(cs.getPropertyValue('--text').trim()) ?? { r: 255, g: 255, b: 255 };
    const trackFaint = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14)`;
    const trackSolid = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.42)`;
    const col = {
      signal: cs.getPropertyValue('--signal').trim() || '#e10600',
      data: cs.getPropertyValue('--data').trim() || '#35e0d0',
      warn: cs.getPropertyValue('--warn').trim() || '#f5a623',
      pos: cs.getPropertyValue('--pos').trim() || '#16c784',
      text: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    };

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // ---- pist ----
    const strokePath = (pts: Pt[], style: string, width: number): void => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      pts.forEach((p, i) => {
        const cx = toX(p.x);
        const cy = toY(p.z);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    };

    if (cachedRef.current) {
      strokePath(cachedRef.current, trackSolid, 10);
      const s = cachedRef.current[0];
      ctx.beginPath();
      ctx.arc(toX(s.x), toY(s.z), 5, 0, Math.PI * 2);
      ctx.fillStyle = col.text;
      ctx.fill();
    } else {
      for (const p of paths.values()) strokePath(p, trackFaint, 8);
    }

    // ---- öncelik haritası ----
    const priority = new Map<string, { pos: number; kind: 'player' | 'top3' | 'near' }>();
    const lb = frame?.lb_data;
    if (lb?.leaderboard) {
      const pp = lb.player_pos || -1;
      for (const row of lb.leaderboard) {
        const rid = String(row.id);
        if (row.id === 0 || row.is_player) priority.set(rid, { pos: row.pos, kind: 'player' });
        else if (row.pos <= 3) priority.set(rid, { pos: row.pos, kind: 'top3' });
        else if (pp !== -1 && (row.pos === pp - 1 || row.pos === pp + 1))
          priority.set(rid, { pos: row.pos, kind: 'near' });
      }
    }

    // ---- araç noktaları ----
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "600 12px 'IBM Plex Mono', ui-monospace, monospace";
    for (const car of map) {
      const id = String(car[0]);
      const cx = toX(-Number(car[1]));
      const cy = toY(Number(car[2]));
      const sd = priority.get(id);
      ctx.beginPath();
      if (sd) {
        const style =
          sd.kind === 'player' ? col.signal : sd.kind === 'top3' ? col.data : col.warn;
        const r = sd.kind === 'player' ? 12 : 10;
        if (sd.kind === 'player') {
          ctx.shadowBlur = 14;
          ctx.shadowColor = style;
        }
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = style;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = sd.kind === 'player' ? '#fff' : '#000';
        ctx.fillText(String(sd.pos), cx, cy + 1);
      } else {
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = col.pos;
        ctx.fill();
      }
    }
  }, [frame]);

  // yeniden boyutlanınca backing store'u geçersiz kıl → sonraki frame yeniden kurar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      canvas.width = 0;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const trackLabel = trackName ? `${t('ac_track')}: ${trackName.toUpperCase()}` : t('ac_track');

  return (
    <div className={styles.radar}>
      <div className={styles.head}>
        <span className={styles.state} data-locked={locked ? 'true' : 'false'}>
          {locked ? t('ac_map_locked') : t('ac_map_learning')}
        </span>
        <span className={styles.track}>{trackLabel}</span>
        <button type="button" className={styles.reset} onClick={() => resetMap(true)}>
          {t('ac_reset_map')}
        </button>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
});
