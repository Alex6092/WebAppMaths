import { getTheme, type Theme } from '@app/themes';

/** Applique les couleurs du thème sous forme de variables CSS. */
export function applyTheme(themeId: string | null | undefined): Theme {
  const theme = getTheme(themeId);
  const vars: Record<string, string> = {
    '--primary': theme.colors.primary,
    '--primary-dark': theme.colors.primaryDark,
    '--primary-soft': theme.colors.primarySoft,
    '--accent': theme.colors.accent,
    '--accent-dark': theme.colors.accentDark,
    '--bg': theme.colors.background,
    '--surface': theme.colors.surface,
    '--text': theme.colors.text,
    '--text-soft': theme.colors.textSoft,
  };
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.primary);
  return theme;
}
