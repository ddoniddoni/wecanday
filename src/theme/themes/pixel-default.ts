import { palette } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

export const pixelDefaultTheme: AppTheme = {
  id: 'pixel-default',
  isDark: false,
  colors: {
    background: palette.pixelSky,
    surface: palette.paper,
    text: palette.ink,
    textMuted: palette.moss,
    primary: palette.pixelGround,
    onPrimary: palette.paper,
    accent: palette.sun,
    border: palette.ink,
    focus: palette.ink,
  },
};
