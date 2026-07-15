import type { CompanionId } from '@/features/companion/domain/companions';
import { companionAccents } from '@/theme/tokens';
import type { AppTheme, ThemeId } from '@/theme/types';

type CompanionAccent = Pick<AppTheme['colors'], 'accent' | 'focus' | 'onPrimary' | 'primary'>;

export function getCompanionAccent(
  themeId: ThemeId,
  companionId: CompanionId,
): CompanionAccent {
  return companionAccents[themeId][companionId];
}

export function applyCompanionAccent(
  theme: AppTheme,
  companionId: CompanionId,
): AppTheme {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      ...getCompanionAccent(theme.id, companionId),
    },
  };
}
