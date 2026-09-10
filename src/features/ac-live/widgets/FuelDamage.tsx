import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { clamp, fuelBarColor } from '../acUtils';
import w from './widgets.module.css';

/** Yakıt (L + dinamik bar) ve hasar (% + kırmızı bar). */
export const FuelDamage = memo(function FuelDamage({
  fuel,
  fuelPct,
  damage,
}: {
  fuel: number;
  fuelPct: number;
  damage: number;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className={w.meter}>
        <div className={w.meterTop}>
          <span>{t('ac_fuel')}</span>
          <b>{fuel.toFixed(1)} L</b>
        </div>
        <div className={w.bar}>
          <span
            className={w.barFill}
            style={{ width: `${clamp(fuelPct, 0, 100)}%`, background: fuelBarColor(fuelPct) }}
          />
        </div>
      </div>
      <div className={w.meter}>
        <div className={w.meterTop}>
          <span>{t('ac_damage')}</span>
          <b>{Math.round(damage)}%</b>
        </div>
        <div className={w.bar}>
          <span
            className={w.barFill}
            data-kind="damage"
            style={{ width: `${clamp(damage, 0, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
});
