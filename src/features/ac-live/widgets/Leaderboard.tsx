import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AcLeaderboardData } from '@/api/types';
import { visibleLeaderboardRows } from '../acUtils';
import w from './widgets.module.css';

/** Canlı sıralama: ilk 3 + oyuncu ve komşuları. Oyuncu satırı vurgulu, en hızlı tur mor. */
export const Leaderboard = memo(function Leaderboard({ data }: { data?: AcLeaderboardData }) {
  const { t } = useTranslation();
  const rows = data ? visibleLeaderboardRows(data.leaderboard, data.player_pos || 1) : [];

  if (rows.length === 0) {
    return <p className={w.lbEmpty}>{t('ac_lb_empty')}</p>;
  }

  return (
    <div className={w.lb}>
      {rows.map((r, i) => (
        <div
          key={`${r.id ?? r.pos}-${i}`}
          className={w.lbRow}
          data-player={r.is_player ? 'true' : undefined}
        >
          <span className={w.lbPos}>{r.pos}</span>
          <span className={w.lbName}>{r.name}</span>
          <span className={w.lbDelta}>{String(r.delta ?? '')}</span>
          <span className={w.lbTime} data-fastest={r.is_fastest ? 'true' : undefined}>
            {String(r.time ?? '')}
          </span>
        </div>
      ))}
    </div>
  );
});
