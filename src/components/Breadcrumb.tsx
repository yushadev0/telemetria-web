import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import styles from './Breadcrumb.module.css';

export interface Crumb {
  label: string;
  /** Verilmezse (veya son öğe) düz metin, tıklanamaz. */
  to?: string;
}

/**
 * URL akışından türetilen yol: `F1 / 2024 / Bahrain Grand Prix / Race / VER`.
 * Her segment kendi route'una <Link>; son segment aktif (sinyal rengi).
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav className={styles.crumbs} aria-label="Sayfa yolu">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <span className={styles.slash} aria-hidden>
                /
              </span>
            )}
            {item.to && !isLast ? (
              <Link className={styles.link} to={item.to}>
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? styles.current : styles.link}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
