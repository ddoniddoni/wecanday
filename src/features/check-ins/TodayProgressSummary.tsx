import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, typography } from '@/theme/tokens';

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
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primary,
          borderBottomColor: theme.colors.focus,
          borderColor: theme.colors.focus,
        },
      ]}
    >
      <View style={[styles.metric, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <MaterialIcons color={palette.lightSecondary} name="check-circle-outline" size={20} />
        <Text style={[styles.metricValue, { color: palette.lightSecondary }]}>
          {t('home.routineCount', { completed: completedCount, total: totalCount })}
        </Text>
        <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
          {t('home.routinesLabel')}
        </Text>
      </View>
      <View style={[styles.metric, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <MaterialIcons color={palette.lightAccent} name="local-fire-department" size={20} />
        <Text style={[styles.metricValue, { color: theme.colors.text }]}>{streakLabel}</Text>
        <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
          {t('home.streakLabel')}
        </Text>
      </View>
      <View style={[styles.metric, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <MaterialIcons color={palette.lightGold} name="workspace-premium" size={20} />
        <Text style={[styles.metricValue, { color: theme.colors.text }]}>{t('home.proValue')}</Text>
        <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
          {t('home.proLabel')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'stretch', borderBottomWidth: 4, borderRadius: radii.md, borderWidth: 2, flexDirection: 'row', gap: spacing.sm, minHeight: 112, padding: spacing.sm },
  metric: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 2, flex: 1, gap: 2, justifyContent: 'center', minWidth: 0, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  metricLabel: { fontFamily: typography.family.bold, fontSize: 11, lineHeight: 14, textAlign: 'center' },
  metricValue: { fontFamily: typography.family.bold, fontSize: 16, lineHeight: 20, textAlign: 'center' },
});
