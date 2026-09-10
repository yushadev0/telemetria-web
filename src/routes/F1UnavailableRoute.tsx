import { useTranslation } from 'react-i18next';
import { PhasePlaceholder } from './PhasePlaceholder';

/**
 * `/f1` — Canlı telemetri kalıcı olarak devre dışı: livetiming.formula1.com
 * artık ucuz VPS/barındırma sağlayıcılarının IP'lerini toplu olarak
 * bloklamaya başladı (CloudFront WAF, IP-reputation). Backend kodu bir anı
 * olarak korunuyor; sadece bu ekran gerçek F1 akışının yerini alıyor.
 */
export function F1UnavailableRoute() {
  const { t } = useTranslation();
  return (
    <PhasePlaceholder
      crumbs={[{ label: t('f1_mode') }]}
      title={t('f1_unavailable_title')}
      phase={t('f1_unavailable_tag')}
      note={t('f1_unavailable_note')}
    />
  );
}
