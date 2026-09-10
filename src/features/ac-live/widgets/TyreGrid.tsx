import { memo } from 'react';
import { tyreTempColor } from '../acUtils';
import w from './widgets.module.css';

export interface TyreGridProps {
  flT: number;
  flP: number;
  frT: number;
  frP: number;
  rlT: number;
  rlP: number;
  rrT: number;
  rrP: number;
}

/** Lastik grid 2×2 (FL/FR/RL/RR) — çekirdek °C (renk kodlu) + psi. */
export const TyreGrid = memo(function TyreGrid(p: TyreGridProps) {
  const cells: Array<{ pos: string; temp: number; psi: number }> = [
    { pos: 'FL', temp: p.flT, psi: p.flP },
    { pos: 'FR', temp: p.frT, psi: p.frP },
    { pos: 'RL', temp: p.rlT, psi: p.rlP },
    { pos: 'RR', temp: p.rrT, psi: p.rrP },
  ];
  return (
    <div className={w.tyres}>
      {cells.map((c) => (
        <div key={c.pos} className={w.tyre}>
          <span className={w.tyrePos}>{c.pos}</span>
          <span className={w.tyreTemp} style={{ color: tyreTempColor(c.temp) }}>
            {Math.round(c.temp)}°C
          </span>
          <span className={w.tyrePsi}>{Math.round(c.psi)} psi</span>
        </div>
      ))}
    </div>
  );
});
