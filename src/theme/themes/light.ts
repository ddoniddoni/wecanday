import { palette } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

export const lightTheme: AppTheme = {
  id: 'light',
  isDark: false,
  isPixel: false,
  colors: {
    background: palette.lightBackground,
    surface: palette.lightSurface,
    text: palette.lightText,
    textMuted: palette.lightMuted,
    primary: palette.lightPrimary,
    onPrimary: palette.lightSurface,
    accent: palette.lightAccent,
    border: palette.lightBorder,
    focus: palette.lightPrimary,
  },
};
