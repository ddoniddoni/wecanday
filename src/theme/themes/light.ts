import { palette } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

export const lightTheme: AppTheme = {
  id: 'light',
  isDark: false,
  colors: {
    background: palette.cream,
    surface: palette.paper,
    text: palette.ink,
    textMuted: palette.moss,
    primary: palette.moss,
    accent: palette.sun,
    border: palette.borderLight,
    focus: palette.moss,
  },
};
