// Dark/Light Theme configuration

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'app_theme';

export function getStoredTheme(): ThemeMode {
  return localStorage.getItem(THEME_KEY) as ThemeMode || 'light';
}

export function setStoredTheme(theme: ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  const isDark =
  theme === 'dark' ||
  theme === 'system' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const themeConfig = {
  colors: {
    primary: 'heritage-gold',
    secondary: 'warm-800',
    background: 'cream',
    surface: 'white',
    error: 'red',
    success: 'green'
  },
  fonts: {
    heading: 'font-heading',
    body: 'font-sans'
  }
};