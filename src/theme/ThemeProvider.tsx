import { useEffect, type ReactNode } from 'react';
import { useUiStore } from '@/store/useUiStore';

/**
 * `themeMode` → <html data-theme> eşitlemesi.
 * - 'dark' / 'light' → attribute explicit yazılır (toggle bunu ezer)
 * - 'system'         → attribute kaldırılır, kontrol prefers-color-scheme'e döner
 *
 * Renk paletinin tamamı tokens.css'te CSS custom property olarak durur; burada
 * yalnızca hangi setin aktif olacağına karar veriyoruz. FOUC'u önlemek için
 * index.html zaten data-theme="dark" ile geliyor.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeMode = useUiStore((s) => s.themeMode);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', themeMode);
    }
  }, [themeMode]);

  return <>{children}</>;
}
