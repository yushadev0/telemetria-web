import { Outlet } from 'react-router-dom';
import { Masthead } from './Masthead';
import styles from './AppShell.module.css';

/** Uygulama kabuğu: kalıcı masthead + tam ekran route çıkışı. */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <Masthead />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
