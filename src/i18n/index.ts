import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './tr.json';
import en from './en.json';
import type { Language } from '@/store/useUiStore';

export const resources = {
  tr: { translation: tr },
  en: { translation: en },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'tr',
  fallbackLng: 'tr',
  supportedLngs: ['tr', 'en'],
  // "events.Bahrain Grand Prix" gibi boşluklu anahtarlara nokta ile ineriz;
  // isim içinde nokta bulunmadığı için güvenli.
  keySeparator: '.',
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Store <-> i18next dil eşitlemesi + <html lang>. */
export function applyLanguage(lang: Language): void {
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

/** Nested map çevirileri: bulunamazsa ham değeri döndürür (mevcut davranış). */
export function translateEvent(eventName: string | null | undefined): string {
  if (!eventName) return '';
  return i18n.t(`events.${eventName}`, { defaultValue: eventName });
}

export function translateCountry(country: string | null | undefined): string {
  if (!country) return '';
  return i18n.t(`countries.${country}`, { defaultValue: country });
}

export function translateSession(sessionName: string | null | undefined): string {
  if (!sessionName) return '';
  return i18n.t(`sessions.${sessionName.trim()}`, { defaultValue: sessionName });
}

export default i18n;
