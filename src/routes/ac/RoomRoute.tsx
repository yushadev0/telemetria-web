import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SubBar } from '@/components/SubBar';
import { ROOM_CODE_RE } from '@/features/ac-live/acUtils';
import screen from '../screen.module.css';
import styles from './room.module.css';

/** `/ac` — Assetto Corsa oda kodu girişi. Geçerli kodda `/ac/:room`'a geçer. */
export function RoomRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!ROOM_CODE_RE.test(value)) {
      setError(t('roomCodeInvalid'));
      setShake(true);
      return;
    }
    setError(null);
    navigate(`/ac/${value}`);
  };

  return (
    <div className={screen.screen}>
      <SubBar crumbs={[{ label: t('ac_mode') }]} />
      <div className={screen.content}>
        <div className={styles.wrap}>
          <span className={styles.tag}>ASSETTO CORSA · LIVE</span>
          <h1 className={styles.title}>{t('enterRoomCode')}</h1>

          <form className={styles.form} onSubmit={submit}>
            <input
              className={`${styles.input} ${shake ? styles.shake : ''}`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              onAnimationEnd={() => setShake(false)}
              placeholder={t('roomCodePlaceholder')}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={13}
              aria-label={t('enterRoomCode')}
              aria-invalid={error ? true : undefined}
            />
            <button type="submit" className={styles.connect}>
              {t('connectBtn')}
            </button>
            <p className={styles.status} data-tone={error ? 'error' : undefined} role="status">
              {error ?? ''}
            </p>
          </form>

          <p className={styles.hint}>{t('roomHint')}</p>
        </div>
      </div>
    </div>
  );
}
