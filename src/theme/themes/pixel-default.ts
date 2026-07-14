import { palette } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

export const pixelDefaultTheme: AppTheme = {
  id: 'pixel-default',
  isDark: false,
  colors: {
    background: palette.cream,
    surface: palette.paper,
    text: palette.ink,
    textMuted: palette.moss,
    primary: palette.moss,
    onPrimary: palette.paper,
    accent: palette.sun,
    border: palette.borderLight,
    focus: palette.moss,
  },
};
