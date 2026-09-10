import { useUiStore, type Language } from '@/store/useUiStore';
import { useLanguageMorph } from '@/hooks/useLanguageMorph';
import styles from './Segmented.module.css';

const LANGS: { lang: Language; label: string }[] = [
  { lang: 'tr', label: 'Türkçe' },
  { lang: 'en', label: 'English' },
];

/**
 * TR | EN segmentli kontrol. Seçim `switchLanguage` üzerinden gider →
 * görünür metin "decode" animasyonuyla yeni dile geçer (useLanguageMorph).
 * `data-no-morph`: butonların kendisi karışmaz.
 */
export function LanguagePicker() {
  const language = useUiStore((s) => s.language);
  const { switchLanguage } = useLanguageMorph();

  return (
    <div className={styles.group} role="group" aria-label="Dil" data-no-morph>
      {LANGS.map(({ lang, label }) => (
        <button
          key={lang}
          type="button"
          className={`${styles.seg} ${styles.segText} ${language === lang ? styles.active : ''}`}
          aria-pressed={language === lang}
          aria-label={label}
          onClick={() => switchLanguage(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
