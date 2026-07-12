import { palette } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

export const darkTheme: AppTheme = {
  id: 'dark',
  isDark: true,
  colors: {
    background: palette.night,
    surface: palette.nightRaised,
    text: palette.nightText,
    textMuted: palette.mint,
    primary: palette.mint,
    onPrimary: palette.ink,
    accent: palette.sun,
    border: palette.borderDark,
    focus: palette.mint,
  },
};
