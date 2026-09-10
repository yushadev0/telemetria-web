import { Monitor, Moon, Sun } from 'lucide-react';
import { useUiStore, type ThemeMode } from '@/store/useUiStore';
import styles from './Segmented.module.css';

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'system', label: 'Sistem teması', Icon: Monitor },
  { mode: 'light', label: 'Açık tema', Icon: Sun },
  { mode: 'dark', label: 'Koyu tema', Icon: Moon },
];

/** AUTO / ☀ / ☾ segmentli kontrol. Seçim localStorage'da kalıcı (useUiStore). */
export function ThemeToggle() {
  const themeMode = useUiStore((s) => s.themeMode);
  const setThemeMode = useUiStore((s) => s.setThemeMode);

  return (
    <div className={styles.group} role="group" aria-label="Tema">
      {OPTIONS.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          className={`${styles.seg} ${themeMode === mode ? styles.active : ''}`}
          aria-pressed={themeMode === mode}
          aria-label={label}
          title={label}
          onClick={() => setThemeMode(mode)}
        >
          <Icon size={13} aria-hidden />
        </button>
      ))}
    </div>
  );
}
