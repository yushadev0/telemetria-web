import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { compoundColorVar, compoundTone } from '../acUtils';
import type { AcDerived } from '../useAcSocket';
import w from './widgets.module.css';

export interface DriverInfoProps {
  driver: string;
  car: string;
  compound: string;
  curTime: string;
  lastTime: string;
  bestTime: string;
  sector: number;
  penalty: number;
  lapInvalid: boolean;
  bestTone: AcDerived['bestTone'];
}

/** Sol alt pano: sürücü/araç/lastik + tur süreleri + sektör + ceza mantığı. */
export const DriverInfo = memo(function DriverInfo(p: DriverInfoProps) {
  const { t } = useTranslation();

  let penaltyText = '0';
  let penaltyTone: 'invalid' | 'penalty' | undefined;
  if (p.lapInvalid) {
    penaltyText = t('ac_invalid_lap');
    penaltyTone = 'invalid';
  } else if (p.penalty > 0) {
    penaltyText = `${p.penalty} ${t('ac_penalty')}`;
    penaltyTone = 'penalty';
  }

  return (
    <div className={w.info}>
      <Row k={t('ac_driver')} v={p.driver || 'UNKNOWN'} />
      <Row k={t('ac_car')} v={p.car || 'UNKNOWN'} />
      <div className={w.infoRow}>
        <span className={w.infoKey}>{t('ac_tyres')}</span>
        <span className={w.infoVal} style={{ color: compoundColorVar[compoundTone(p.compound)] }}>
          {p.compound || 'UNKNOWN'}
        </span>
      </div>
      <div className={w.infoRow}>
        <span className={w.infoKey}>{t('ac_current_lap')}</span>
        <span className={w.infoVal} data-strike={p.lapInvalid ? 'true' : undefined}>
          {p.curTime || '0:00.000'}
        </span>
      </div>
      <Row k={t('ac_last_lap')} v={p.lastTime || '0:00.000'} />
      <div className={w.infoRow}>
        <span className={w.infoKey}>{t('ac_best_lap')}</span>
        <span className={w.infoVal} data-best={p.bestTone}>
          {p.bestTime || '0:00.000'}
        </span>
      </div>
      <Row k={t('ac_sector')} v={String(p.sector + 1)} />
      <div className={w.infoRow}>
        <span className={w.infoKey}>{t('ac_penalty')}</span>
        <span className={`${w.infoVal} ${w.penaltyVal}`} data-tone={penaltyTone}>
          {penaltyText}
        </span>
      </div>
    </div>
  );
});

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className={w.infoRow}>
      <span className={w.infoKey}>{k}</span>
      <span className={w.infoVal}>{v}</span>
    </div>
  );
}
