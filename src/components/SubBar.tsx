import type { ReactNode } from 'react';
import { Breadcrumb, type Crumb } from './Breadcrumb';
import styles from './SubBar.module.css';

/** Masthead altında bağlam çubuğu: solda breadcrumb, sağda opsiyonel eylem/sayaç. */
export function SubBar({ crumbs, right }: { crumbs: Crumb[]; right?: ReactNode }) {
  return (
    <div className={styles.subbar}>
      <Breadcrumb items={crumbs} />
      {right && <div className={styles.right}>{right}</div>}
    </div>
  );
}
