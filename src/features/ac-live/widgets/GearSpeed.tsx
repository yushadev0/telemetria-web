import { memo } from 'react';
import { gearLabel } from '../acUtils';
import w from './widgets.module.css';

/** Büyük vites + hız kümesi + rpm sayısı. */
export const GearSpeed = memo(function GearSpeed({
  gear,
  speed,
  rpm,
}: {
  gear: number;
  speed: number;
  rpm: number;
}) {
  return (
    <div className={w.cluster}>
      <span className={w.gear}>{gearLabel(gear)}</span>
      <span className={w.rpmNum}>{Math.round(rpm)} RPM</span>
      <span className={w.speed}>
        {Math.round(speed)}
        <span className={w.speedUnit}>km/h</span>
      </span>
    </div>
  );
});
