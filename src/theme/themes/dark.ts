import { palette } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

export const darkTheme: AppTheme = {
  id: 'dark',
  isDark: true,
  colors: {
    background: palette.darkBackground,
    surface: palette.darkSurface,
    text: palette.darkText,
    textMuted: palette.darkMuted,
    primary: palette.darkPrimary,
    onPrimary: palette.darkBackground,
    accent: palette.darkAccent,
    border: palette.darkBorder,
    focus: palette.darkPrimary,
  },
};
