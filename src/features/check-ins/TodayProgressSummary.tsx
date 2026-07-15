import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { RoutineDayTiming } from '@/features/routine-day/RoutineDayTiming';
import type { RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

type TodayProgressSummaryProps = {
  completedCount: number;
  dailyStreak: number | null;
  isDailyStreakLoading: boolean;
  routineDayConfig: RoutineDayConfig;
  totalCount: number;
};

export function TodayProgressSummary({
  completedCount,
  dailyStreak,
  isDailyStreakLoading,
  routineDayConfig,
  totalCount,
}: TodayProgressSummaryProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const streakLabel = isDailyStreakLoading
    ? t('stats.streakLoading')
    : dailyStreak === null
      ? t('stats.streakUnavailable')
      : t('stats.streakValue', { count: dailyStreak });

  return (
    <View
      accessibilityLabel={t('progressSummary.accessibilityLabel', {
        completed: completedCount,
        streak: streakLabel,
        total: totalCount,
      })}
      style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={styles.metric}>
        <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
          {t('home.routineCount', { completed: completedCount, total: totalCount })}
        </Text>
        <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
          {t('home.routinesLabel')}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      <View style={styles.metric}>
        <Text style={[styles.metricValue, { color: theme.colors.accent }]}>{streakLabel}</Text>
        <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
          {t('home.streakLabel')}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      <View style={styles.metric}>
        <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
          {t('home.routineDayLabel')}
        </Text>
        <RoutineDayTiming config={routineDayConfig} variant="inline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'stretch', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', minHeight: 84, paddingVertical: spacing.sm },
  divider: { marginVertical: spacing.xs, width: 1 },
  metric: { alignItems: 'center', flex: 1, gap: spacing.xs, justifyContent: 'center', minWidth: 0, paddingHorizontal: spacing.xs },
  metricLabel: { fontSize: 11, lineHeight: 14, textAlign: 'center' },
  metricValue: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body, textAlign: 'center' },
});
