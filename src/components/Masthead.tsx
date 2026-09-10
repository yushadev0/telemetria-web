import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { LanguagePicker } from './LanguagePicker';
import styles from './Masthead.module.css';

/** Kalıcı üst bar: wordmark + global kontroller. Her ekranda görünür. */
export function Masthead() {
  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.wordmark} aria-label="Telemetria — ana ekran">
        <span className={styles.dot} aria-hidden />
        TELEMETRIA
      </Link>

      <div className={styles.controls}>
        <LanguagePicker />
        <span className={styles.sep} aria-hidden />
        <ThemeToggle />
      </div>
    </header>
  );
}
