import type { ReactNode } from 'react';
import { SubBar } from '@/components/SubBar';
import type { Crumb } from '@/components/Breadcrumb';
import screen from './screen.module.css';

/**
 * Faz 0 iskeleti: henüz uygulanmamış ekranlar için terminal tarzı yer tutucu.
 * Breadcrumb gerçek route'lardan türetilir; içerik sonraki fazlarda gelecek.
 */
export function PhasePlaceholder({
  crumbs,
  title,
  phase,
  note,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  phase: string;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <div className={screen.screen}>
      <SubBar crumbs={crumbs} right={<span>{phase}</span>} />
      <div className={screen.content}>
        <div className={screen.block}>
          <span className={screen.blockTag}>{phase}</span>
          <h1 className={screen.blockTitle}>
            {title}
            <span className={screen.caret} aria-hidden />
          </h1>
          {note && <p className={screen.blockNote}>{note}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
