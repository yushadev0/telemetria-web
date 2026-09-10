import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SubBar } from '@/components/SubBar';
import screen from './screen.module.css';

export function NotFoundRoute() {
  const { t } = useTranslation();
  return (
    <div className={screen.screen}>
      <SubBar crumbs={[{ label: '404' }]} />
      <div className={screen.content}>
        <div className={screen.block}>
          <span className={screen.blockTag}>404</span>
          <h1 className={screen.blockTitle}>
            {t('emptyTitle')}
            <span className={screen.caret} aria-hidden />
          </h1>
          <p className={screen.blockNote}>
            <Link to="/" className={screen.blockTag}>
              {t('selectMode')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
