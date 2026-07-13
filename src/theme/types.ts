export type ThemeId = 'light' | 'dark' | 'pixel-default';
export type ThemePreference = 'system' | ThemeId;

export function isThemePreference(value: string): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark' || value === 'pixel-default';
}

export type AppTheme = {
  id: ThemeId;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    onPrimary: string;
    accent: string;
    border: string;
    focus: string;
  };
};
