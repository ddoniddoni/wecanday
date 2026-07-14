import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

type StreakMomentCardProps = {
  dailyStreak: number | null;
  isAllComplete: boolean;
};

export function StreakMomentCard({
  dailyStreak,
  isAllComplete,
}: StreakMomentCardProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();

  if (dailyStreak === null || (!isAllComplete && dailyStreak > 0)) {
    return null;
  }

  const title = isAllComplete
    ? t('streakMoment.celebration.title', { count: dailyStreak })
    : t('streakMoment.restart.title');
  const description = isAllComplete
    ? t('streakMoment.celebration.description')
    : t('streakMoment.restart.description');

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="summary"
      style={[
        styles.card,
        {
          backgroundColor: isAllComplete ? theme.colors.primary : theme.colors.surface,
          borderColor: isAllComplete ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: isAllComplete ? theme.colors.onPrimary : theme.colors.text }]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          { color: isAllComplete ? theme.colors.onPrimary : theme.colors.textMuted },
        ]}
      >
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.size.heading,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.heading,
  },
  description: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
});
