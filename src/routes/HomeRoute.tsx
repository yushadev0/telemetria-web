import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import f1Image from '@/assets/home/f1.jpg';
import acImage from '@/assets/home/ac.avif';
import styles from './HomeRoute.module.css';

interface Slot {
  index: string;
  to: string;
  name: string;
  descKey: 'live_telemetry' | 'coming_soon';
  image: string;
}

const SLOTS: Slot[] = [
  { index: '01', to: '/f1', name: 'FORMULA 1', descKey: 'live_telemetry', image: f1Image },
  { index: '02', to: '/ac', name: 'ASSETTO CORSA', descKey: 'coming_soon', image: acImage },
];

/** `/` — Mod seçimi. İki "grid slot": başlangıç grid'inde iki yer. */
export function HomeRoute() {
  const { t } = useTranslation();

  return (
    <div className={styles.grid}>
      {SLOTS.map((slot, i) => (
        <Link
          key={slot.to}
          to={slot.to}
          className={styles.slot}
          style={{ '--i': i } as CSSProperties}
        >
          <img className={styles.media} src={slot.image} alt="" aria-hidden />
          <span className={styles.scrim} aria-hidden />
          <span className={styles.index} aria-hidden>
            {slot.index}
          </span>
          <span className={styles.body}>
            <span className={styles.name}>{slot.name}</span>
            <span className={styles.desc}>{t(slot.descKey)}</span>
            <ArrowRight className={styles.arrow} size={20} aria-hidden />
          </span>
        </Link>
      ))}
    </div>
  );
}
