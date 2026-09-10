import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/api/queryClient';
import i18n, { applyLanguage } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { LanguageMorphProvider } from '@/hooks/useLanguageMorph';
import { useUiStore } from '@/store/useUiStore';
import { router } from './router';

export function App() {
  const language = useUiStore((s) => s.language);

  // Store (localStorage kaynaklı) → i18next + <html lang> eşitlemesi.
  // Not: dil butonu geçişi useLanguageMorph üzerinden gider (decode animasyonu);
  // bu effect ilk yükleme ve dış senkron için.
  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <LanguageMorphProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </LanguageMorphProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
