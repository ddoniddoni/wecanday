import { palette } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

export const pixelDefaultTheme: AppTheme = {
  id: 'pixel-default',
  isDark: false,
  isPixel: true,
  colors: {
    background: palette.pixelSky,
    surface: palette.pixelCloud,
    text: palette.pixelInk,
    textMuted: palette.pixelShade,
    primary: palette.pixelCoral,
    onPrimary: palette.pixelCloud,
    accent: palette.pixelGold,
    border: palette.pixelBorder,
    focus: palette.pixelFocus,
  },
};
