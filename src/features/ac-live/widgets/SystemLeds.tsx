import { memo } from 'react';
import w from './widgets.module.css';

export interface SystemLedsProps {
  drs: number;
  tc: number;
  abs: number;
  pit: number;
}

/** DRS / TC / ABS / PIT durum LED'leri. */
export const SystemLeds = memo(function SystemLeds({ drs, tc, abs, pit }: SystemLedsProps) {
  const leds: Array<{ kind: string; on: boolean }> = [
    { kind: 'DRS', on: drs === 1 },
    { kind: 'TC', on: tc > 0 },
    { kind: 'ABS', on: abs > 0 },
    { kind: 'PIT', on: pit === 1 },
  ];
  return (
    <div className={w.sysLeds}>
      {leds.map((l) => (
        <span key={l.kind} className={w.sysLed} data-kind={l.kind} data-on={l.on ? 'true' : undefined}>
          {l.kind}
        </span>
      ))}
    </div>
  );
});
