import { memo } from 'react';
import { clamp } from '../acUtils';
import w from './widgets.module.css';

/** THR (yeşil, soldan) / BRK (kırmızı, sağdan) yatay bar. gas/brake 0..1. */
export const Pedals = memo(function Pedals({ gas, brake }: { gas: number; brake: number }) {
  return (
    <div className={w.pedals}>
      <span className={w.pedalLabel}>THR</span>
      <div className={w.pedalBg}>
        <span
          className={w.pedalFill}
          data-kind="gas"
          style={{ width: `${clamp(gas * 100, 0, 100)}%` }}
        />
      </div>
      <div className={w.pedalBg}>
        <span
          className={w.pedalFill}
          data-kind="brake"
          style={{ width: `${clamp(brake * 100, 0, 100)}%` }}
        />
      </div>
      <span className={w.pedalLabel}>BRK</span>
    </div>
  );
});
