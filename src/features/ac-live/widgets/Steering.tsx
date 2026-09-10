import { memo } from 'react';
import w from './widgets.module.css';

/** Direksiyon: steer (−1..1) × 180° döner. 0°'de kırmızı (referans). */
export const Steering = memo(function Steering({ steer }: { steer: number }) {
  const deg = steer * 180;
  const angle = Math.round(deg);

  return (
    <div className={w.steer}>
      <svg
        className={w.steerSvg}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${deg}deg)` }}
        aria-hidden
      >
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="50" cy="50" r="7" fill="currentColor" />
        <line x1="50" y1="50" x2="50" y2="12" stroke="currentColor" strokeWidth="5" />
        <line x1="50" y1="50" x2="18" y2="66" stroke="currentColor" strokeWidth="5" />
        <line x1="50" y1="50" x2="82" y2="66" stroke="currentColor" strokeWidth="5" />
      </svg>
      <span className={w.steerVal} data-centered={angle === 0 ? 'true' : undefined}>
        {angle}°
      </span>
    </div>
  );
});
