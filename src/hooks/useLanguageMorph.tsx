import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { morphText } from '@/lib/textMorph';
import { useUiStore, type Language } from '@/store/useUiStore';

/* ==========================================================================
   Dil değiştirme "decode" animasyonu — yusa.app'ten uyarlandı.
   Tıklama → görünür metin yaprakları toplanır → dil değişir (React yeni
   string'leri yazar) → her yaprak yeni metnine karışıp kilitlenir.
   ========================================================================== */

interface LanguageMorphValue {
  switchLanguage: (lng: Language) => void;
}

const Ctx = createContext<LanguageMorphValue | null>(null);

const TEXT_SELECTOR =
  'h1,h2,h3,h4,h5,h6,p,li,a,span,button,dt,dd,figcaption,strong,em,label,blockquote,summary,th,td,time';

const STEPS = 30;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Ekranda görünen, tek text-node içeren yaprakları yukarıdan aşağıya toplar. */
function collectTextLeaves(): HTMLElement[] {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const out: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>(TEXT_SELECTOR).forEach((el) => {
    if (el.childElementCount !== 0) return;
    if (!el.textContent?.trim()) return;
    if (el.closest('[data-no-morph], pre, svg, [aria-hidden="true"]')) return;
    if (el.matches('input, textarea, select')) return;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
    if (r.width < 2 || r.height < 2) return;
    out.push(el);
  });
  out.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  return out.slice(0, 220);
}

export function LanguageMorphProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const setLanguage = useUiStore((s) => s.setLanguage);
  const busyRef = useRef(false);

  const switchLanguage = useCallback(
    (lng: Language) => {
      const base = (i18n.resolvedLanguage ?? 'tr').split('-')[0];
      if (lng === base || busyRef.current) return;

      // Kalıcılık + <html lang> her durumda güncellenir.
      setLanguage(lng);

      if (prefersReducedMotion()) {
        void i18n.changeLanguage(lng);
        return;
      }

      busyRef.current = true;
      // String'ler değişmeden ÖNCE yaprakları yakala.
      const els = collectTextLeaves();

      void i18n.changeLanguage(lng).finally(() => {
        // Bir makrotask, React'in yeni string'leri commit etmesi için yeterli;
        // rAF'ın aksine headless/otomasyon ortamlarında da her zaman çalışır.
        window.setTimeout(() => {
          const stoppers = els
            .filter((el) => el.isConnected)
            .map((el) => morphText(el, el.textContent ?? '', STEPS));
          window.setTimeout(
            () => {
              stoppers.forEach((stop) => stop());
              busyRef.current = false;
            },
            STEPS * 24 + 300,
          );
        }, 0);
      });
    },
    [i18n, setLanguage],
  );

  return <Ctx.Provider value={{ switchLanguage }}>{children}</Ctx.Provider>;
}

// Provider ile aynı dosyada tutuluyor (context deseni); fast-refresh uyarısını sustur.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguageMorph(): LanguageMorphValue {
  return useContext(Ctx) ?? { switchLanguage: () => {} };
}
