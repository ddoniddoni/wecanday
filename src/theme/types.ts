export type ThemeId = 'light' | 'dark' | 'pixel-default';
export type ThemePreference = 'system' | ThemeId;

export type AppTheme = {
  id: ThemeId;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    accent: string;
    border: string;
    focus: string;
  };
};
