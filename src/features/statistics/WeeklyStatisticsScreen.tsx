import type { SupabaseClient } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppTabScreen } from '@/components/AppTabScreen';
import type { PrimaryNavigationActions } from '@/components/PrimaryNavigation';
import { getCurrentRoutineDayWindow, type RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import type { WeeklyStatisticDay, WeeklyStatistics } from '@/features/statistics/domain/weeklyStatistics';
import { loadWeeklyStatistics } from '@/features/statistics/services/weeklyStatisticsService';
import type { Database } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

type WeeklyStatisticsScreenProps = {
  client: SupabaseClient<Database>;
  onBack: () => void;
  primaryNavigation?: PrimaryNavigationActions;
  routineDayConfig: RoutineDayConfig;
  userId: string;
};

export function WeeklyStatisticsScreen({
  client,
  onBack,
  primaryNavigation,
  routineDayConfig,
  userId,
}: WeeklyStatisticsScreenProps) {
  const { i18n, t } = useTranslation('statistics');
  const { theme } = useTheme();
  const [statistics, setStatistics] = useState<WeeklyStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const nextStatistics = await loadWeeklyStatistics(
        client,
        userId,
        getCurrentRoutineDayWindow(routineDayConfig).key,
        routineDayConfig,
      );

      setStatistics(nextStatistics);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [client, routineDayConfig, userId]);

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(initialRefresh);
  }, [refresh]);

  const completionRate = statistics && statistics.scheduledCount > 0
    ? Math.round((statistics.completedCount / statistics.scheduledCount) * 100)
    : null;
  const accessibilitySummary = statistics
    ? t('accessibilitySummary', {
        completed: statistics.completedCount,
        currentStreak: statistics.currentDailyStreak,
        highestStreak: statistics.highestDailyStreak,
        rate: completionRate ?? 0,
        scheduled: statistics.scheduledCount,
      })
    : undefined;

  return (
    <AppTabScreen
      activeTab={primaryNavigation ? 'statistics' : undefined}
      navigation={primaryNavigation}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
              {t('eyebrow')}
            </Text>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
              {t('title')}
            </Text>
          </View>
          {!primaryNavigation ? <Pressable
            accessibilityLabel={t('back')}
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.backButtonLabel, { color: theme.colors.text }]}>{t('back')}</Text>
          </Pressable> : null}
        </View>

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator accessibilityLabel={t('loading')} color={theme.colors.primary} />
            <Text style={[styles.stateText, { color: theme.colors.textMuted }]}>{t('loading')}</Text>
          </View>
        ) : null}

        {!isLoading && hasError ? (
          <View style={styles.stateContainer}>
            <Text accessibilityRole="alert" style={[styles.stateText, { color: theme.colors.text }]}>
              {t('error')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void refresh()}
              style={({ pressed }) => [
                styles.backButton,
                { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.backButtonLabel, { color: theme.colors.text }]}>{t('retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !hasError && statistics && statistics.scheduledCount === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={[styles.stateText, { color: theme.colors.text }]}>{t('emptyTitle')}</Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              {t('emptyDescription')}
            </Text>
          </View>
        ) : null}

        {!isLoading && !hasError && statistics && statistics.scheduledCount > 0 ? (
          <View accessibilityLabel={accessibilitySummary} style={styles.statistics}>
            <View style={styles.summary}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>{t('completionRate')}</Text>
              <View style={styles.summaryRateRow}>
                <Text style={[styles.rate, { color: theme.colors.primary }]}>
                  {t('rateValue', { count: completionRate })}
                </Text>
                <Text style={[styles.summaryCount, { color: theme.colors.textMuted }]}>
                  {t('completionCountCompact', {
                    completed: statistics.completedCount,
                    scheduled: statistics.scheduledCount,
                  })}
                </Text>
              </View>
              <View style={[styles.summaryTrack, { backgroundColor: theme.colors.surface }]}>
                <View
                  style={[
                    styles.summaryFill,
                    { backgroundColor: theme.colors.primary, width: `${completionRate ?? 0}%` },
                  ]}
                />
              </View>
              <Text style={[styles.summaryDescription, { color: theme.colors.textMuted }]}>
                {t('completionCount', {
                  completed: statistics.completedCount,
                  scheduled: statistics.scheduledCount,
                })}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('dailyProgress')}</Text>
              {statistics.days.map((day) => (
                <WeeklyDayRow day={day} key={day.routineDay} locale={i18n.language} t={t} theme={theme} />
              ))}
            </View>

            <View accessibilityRole="summary" style={[styles.streakSummary, { borderColor: theme.colors.border }]}>
              <StreakSummaryItem
                count={statistics.currentDailyStreak}
                label={t('currentStreak')}
                t={t}
                theme={theme}
              />
              <View style={[styles.streakDivider, { backgroundColor: theme.colors.border }]} />
              <StreakSummaryItem
                count={statistics.highestDailyStreak}
                label={t('highestStreak')}
                t={t}
                theme={theme}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppTabScreen>
  );
}

function WeeklyDayRow({
  day,
  locale,
  t,
  theme,
}: {
  day: WeeklyStatisticDay;
  locale: string;
  t: TFunction<'statistics'>;
  theme: AppTheme;
}) {
  const isRestDay = day.scheduledCount === 0;
  const accessibilityValue = isRestDay
    ? t('restDay')
    : t('dailyRate', { completed: day.completedCount, scheduled: day.scheduledCount });
  const value = isRestDay
    ? accessibilityValue
    : t('dailyCompactRate', { completed: day.completedCount, scheduled: day.scheduledCount });

  return (
    <View
      accessibilityLabel={t('dailyAccessibilityLabel', {
        date: formatWeeklyDate(day.routineDay, locale, 'full'),
        value: accessibilityValue,
      })}
      style={styles.dayRow}
    >
      <Text numberOfLines={1} style={[styles.dayKey, { color: theme.colors.textMuted }]}>
        {formatWeeklyDate(day.routineDay, locale, 'compact')}
      </Text>
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: isRestDay ? theme.colors.border : theme.colors.primary,
              width: `${day.completionRate ?? 0}%`,
            },
          ]}
        />
      </View>
      <Text numberOfLines={1} style={[styles.dayValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function StreakSummaryItem({
  count,
  label,
  t,
  theme,
}: {
  count: number;
  label: string;
  t: TFunction<'statistics'>;
  theme: AppTheme;
}) {
  return (
    <View style={styles.streakItem}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.streakValue, { color: theme.colors.primary }]}>
        {t('streakValue', { count })}
      </Text>
    </View>
  );
}

function toUtcDate(routineDay: string): Date {
  const [year, month, day] = routineDay.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day, 12));
}

function formatWeeklyDate(
  routineDay: string,
  locale: string,
  variant: 'compact' | 'full',
): string {
  const isKorean = locale.startsWith('ko');
  const formatPattern = variant === 'compact'
    ? isKorean ? 'M월 d일' : 'EEE d'
    : isKorean ? 'yyyy년 M월 d일 EEEE' : 'EEEE, MMMM d, yyyy';

  return format(toUtcDate(routineDay), formatPattern, { locale: isKorean ? ko : enUS });
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  headerCopy: { flex: 1, gap: spacing.xs },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  title: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading },
  backButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  stateContainer: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center', minHeight: 220, padding: spacing.lg },
  stateText: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  statistics: { gap: spacing.md },
  summary: { gap: spacing.xs, paddingVertical: spacing.sm },
  summaryRateRow: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  summaryCount: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  summaryTrack: { borderRadius: radii.pill, height: 10, overflow: 'hidden' },
  summaryFill: { borderRadius: radii.pill, height: '100%' },
  summaryDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  label: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  rate: { fontSize: typography.size.display, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.display },
  card: { borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  cardTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  dayRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: touchTarget.minimum },
  dayKey: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, width: 72 },
  progressTrack: { borderRadius: radii.pill, flex: 1, height: 8, overflow: 'hidden' },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  dayValue: { flexShrink: 0, fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption, textAlign: 'right' },
  streakSummary: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', paddingTop: spacing.md },
  streakItem: { flex: 1, gap: spacing.xs },
  streakDivider: { height: touchTarget.minimum, marginHorizontal: spacing.md, width: 1 },
  streakValue: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
});
