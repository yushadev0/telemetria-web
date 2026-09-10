import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';
export type Language = 'tr' | 'en';

const THEME_KEY = 'tlm_theme';
const LANG_KEY = 'tlm_lang';

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw && (allowed as readonly string[]).includes(raw)) return raw as T;
  } catch {
    /* localStorage erişilemez (gizli pencere vb.) — sessizce fallback */
  }
  return fallback;
}

function persist(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* yut */
  }
}

/**
 * `system` modunda hangi somut temanın uygulanacağını verir.
 * Diğer modlarda mod = tema.
 */
export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode !== 'system') return mode;
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

interface UiState {
  themeMode: ThemeMode;
  language: Language;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  themeMode: readStored<ThemeMode>(THEME_KEY, ['dark', 'light', 'system'], 'dark'),
  language: readStored<Language>(LANG_KEY, ['tr', 'en'], 'tr'),

  setThemeMode: (mode) => {
    persist(THEME_KEY, mode);
    set({ themeMode: mode });
  },

  /** Güneş/ay slider'ı: yalnızca dark ↔ light arasında gidip gelir. */
  toggleTheme: () => {
    const next = resolveTheme(get().themeMode) === 'dark' ? 'light' : 'dark';
    persist(THEME_KEY, next);
    set({ themeMode: next });
  },

  setLanguage: (lang) => {
    persist(LANG_KEY, lang);
    set({ language: lang });
  },
}));
