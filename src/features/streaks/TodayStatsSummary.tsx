import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

type TodayStatsSummaryProps = {
  completedCount: number;
  dailyStreak: number | null;
  isDailyStreakLoading: boolean;
  totalCount: number;
};

export function TodayStatsSummary({
  completedCount,
  dailyStreak,
  isDailyStreakLoading,
  totalCount,
}: TodayStatsSummaryProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const progressLabel = totalCount === 0
    ? t('stats.noScheduled')
    : t('progress', { completed: completedCount, total: totalCount });
  const streakLabel = isDailyStreakLoading
    ? t('stats.streakLoading')
    : dailyStreak === null
      ? t('stats.streakUnavailable')
      : t('stats.streakValue', { count: dailyStreak });

  return (
    <View
      accessibilityLabel={t('stats.accessibilityLabel', {
        progress: progressLabel,
        streak: streakLabel,
      })}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.stat}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>
          {t('stats.progressLabel')}
        </Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{progressLabel}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>
          {t('stats.streakLabel')}
        </Text>
        <Text style={[styles.value, { color: theme.colors.primary }]}>{streakLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  stat: { flex: 1, gap: spacing.xs },
  label: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
  value: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
});
