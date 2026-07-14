import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { getCompanionAsset, type CompanionId } from '@/features/companion/domain/companions';
import { RoutineDayTiming } from '@/features/routine-day/RoutineDayTiming';
import type { RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

type TodayProgressSummaryProps = {
  companionId: CompanionId;
  completedCount: number;
  dailyStreak: number | null;
  isDailyStreakLoading: boolean;
  routineDayConfig: RoutineDayConfig;
  totalCount: number;
};

export function TodayProgressSummary({
  companionId,
  completedCount,
  dailyStreak,
  isDailyStreakLoading,
  routineDayConfig,
  totalCount,
}: TodayProgressSummaryProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const progressPercent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  const progressLabel = totalCount === 0
    ? t('progressSummary.noScheduled')
    : t('progress', { completed: completedCount, total: totalCount });
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
      <View style={styles.mainRow}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
            {t('progressSummary.eyebrow')}
          </Text>
          <Text style={[styles.progress, { color: theme.colors.text }]}>
            {progressLabel}
          </Text>
          <View style={[styles.track, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.fill, { backgroundColor: theme.colors.primary, width: `${progressPercent}%` }]} />
          </View>
        </View>
        <Image
          accessibilityLabel={t('progressSummary.companionImageLabel')}
          accessibilityRole="image"
          contentFit="contain"
          source={getCompanionAsset(companionId)}
          style={styles.companion}
        />
      </View>
      <View style={[styles.metaRow, { borderTopColor: theme.colors.border }]}>
        <RoutineDayTiming config={routineDayConfig} variant="inline" />
        <Text style={[styles.streak, { color: theme.colors.primary }]}>
          {t('progressSummary.streak', { streak: streakLabel })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  companion: { height: 72, marginEnd: -spacing.sm, width: 72 },
  container: { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.caption },
  fill: { borderRadius: radii.pill, height: '100%' },
  mainRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  metaRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  progress: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading },
  streak: { flexShrink: 1, fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption, textAlign: 'right' },
  track: { borderRadius: radii.pill, height: 8, overflow: 'hidden', width: '100%' },
});
