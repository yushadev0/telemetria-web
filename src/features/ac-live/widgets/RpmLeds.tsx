import { memo } from 'react';
import { RPM_LED_COUNT, rpmLedCount, rpmLedTone } from '../acUtils';
import w from './widgets.module.css';

const LEDS = Array.from({ length: RPM_LED_COUNT }, (_, i) => i + 1);

/** 15 LED şeridi: 5 yeşil / 5 kırmızı / 5 mavi, rpm/8500 oranında dolar. */
export const RpmLeds = memo(function RpmLeds({ rpm }: { rpm: number }) {
  const on = rpmLedCount(rpm);
  return (
    <div className={w.rpmLeds} aria-hidden>
      {LEDS.map((i) => (
        <span
          key={i}
          className={w.rpmLed}
          data-tone={rpmLedTone(i)}
          data-on={i <= on ? 'true' : undefined}
        />
      ))}
    </div>
  );
});
