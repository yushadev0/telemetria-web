import type { ReactNode } from 'react';
import styles from './CardGrid.module.css';

type Layout = 'list' | 'bento';

/**
 * `list`  — hairline ile ayrılmış tam genişlik satırlar (yıl / seans).
 * `bento` — kart ızgarası (pist / pilot). `header` sütun/bölüm etiketi çizer.
 */
export function CardGrid({
  children,
  header,
  layout = 'list',
  className,
}: {
  children: ReactNode;
  header?: ReactNode;
  layout?: Layout;
  className?: string;
}) {
  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={layout === 'bento' ? styles.bento : styles.list}>{children}</div>
    </div>
  );
}
