import { memo } from 'react';
import { clamp, G_LIMIT } from '../acUtils';
import w from './widgets.module.css';

/** G-kuvveti kutusu: crosshair + nokta. Lat sağ/sol, Lon yukarı/aşağı. */
export const GForceMeter = memo(function GForceMeter({
  gLat,
  gLon,
}: {
  gLat: number;
  gLon: number;
}) {
  const left = clamp(50 + (gLat / G_LIMIT) * 50, 3, 97);
  const top = clamp(50 - (gLon / G_LIMIT) * 50, 3, 97);

  return (
    <div>
      <div className={w.gforce}>
        <span className={w.gDot} style={{ left: `${left}%`, top: `${top}%` }} aria-hidden />
      </div>
      <div className={w.gReadout}>
        <span>
          LAT <b>{Math.abs(gLat).toFixed(2)}G</b>
        </span>
        <span>
          LON <b>{Math.abs(gLon).toFixed(2)}G</b>
        </span>
      </div>
    </div>
  );
});
