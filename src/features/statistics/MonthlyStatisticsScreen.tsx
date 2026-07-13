import type { SupabaseClient } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentRoutineDayWindow, type RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import {
  getAdjacentMonthKey,
  type MonthlyStatisticDay,
  type MonthlyPlanStatistic,
  type MonthlyStatistics,
} from '@/features/statistics/domain/monthlyStatistics';
import { loadMonthlyStatistics } from '@/features/statistics/services/monthlyStatisticsService';
import type { Database } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

type MonthlyStatisticsScreenProps = {
  client: SupabaseClient<Database>;
  onBack: () => void;
  routineDayConfig: RoutineDayConfig;
  userId: string;
};

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function MonthlyStatisticsScreen({
  client,
  onBack,
  routineDayConfig,
  userId,
}: MonthlyStatisticsScreenProps) {
  const { i18n, t } = useTranslation('statistics');
  const { theme } = useTheme();
  const currentMonthKey = getCurrentRoutineDayWindow(routineDayConfig).key.slice(0, 7);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [statistics, setStatistics] = useState<MonthlyStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const refresh = useCallback(async (selectedMonthKey: string) => {
    setIsLoading(true);
    setHasError(false);

    try {
      const nextStatistics = await loadMonthlyStatistics(
        client,
        userId,
        selectedMonthKey,
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
      void refresh(monthKey);
    }, 0);

    return () => clearTimeout(initialRefresh);
  }, [monthKey, refresh]);

  const completionRate = statistics && statistics.scheduledCount > 0
    ? Math.round((statistics.completedCount / statistics.scheduledCount) * 100)
    : null;
  const previousRate = statistics?.previousCompletionRate ?? null;
  const monthChange = completionRate === null || previousRate === null
    ? null
    : completionRate - previousRate;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>{t('monthly.eyebrow')}</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
              {t('monthly.title')}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={t('back')}
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.outlineButton,
              { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.outlineButtonLabel, { color: theme.colors.text }]}>{t('back')}</Text>
          </Pressable>
        </View>

        <MonthNavigation
          canGoForward={monthKey < currentMonthKey}
          label={formatMonthLabel(monthKey, i18n.language)}
          onNext={() => setMonthKey((current) => getAdjacentMonthKey(current, 1))}
          onPrevious={() => setMonthKey((current) => getAdjacentMonthKey(current, -1))}
          t={t}
          theme={theme}
        />

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator accessibilityLabel={t('monthly.loading')} color={theme.colors.primary} />
            <Text style={[styles.stateText, { color: theme.colors.textMuted }]}>{t('monthly.loading')}</Text>
          </View>
        ) : null}

        {!isLoading && hasError ? (
          <View style={styles.stateContainer}>
            <Text accessibilityRole="alert" style={[styles.stateText, { color: theme.colors.text }]}>
              {t('monthly.error')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void refresh(monthKey)}
              style={({ pressed }) => [
                styles.outlineButton,
                { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.outlineButtonLabel, { color: theme.colors.text }]}>{t('retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !hasError && statistics && statistics.scheduledCount === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={[styles.stateText, { color: theme.colors.text }]}>{t('monthly.emptyTitle')}</Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              {t('monthly.emptyDescription')}
            </Text>
          </View>
        ) : null}

        {!isLoading && !hasError && statistics && statistics.scheduledCount > 0 ? (
          <View
            accessibilityLabel={t('monthly.accessibilitySummary', {
              completed: statistics.completedCount,
              completedDays: statistics.completedRoutineDayCount,
              rate: completionRate,
              scheduled: statistics.scheduledCount,
            })}
            style={styles.statistics}
          >
            <View style={[styles.rateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>{t('monthly.completionRate')}</Text>
              <Text style={[styles.rate, { color: theme.colors.primary }]}>{t('rateValue', { count: completionRate })}</Text>
              <Text style={[styles.description, { color: theme.colors.textMuted }]}>
                {t('monthly.completionCount', {
                  completed: statistics.completedCount,
                  scheduled: statistics.scheduledCount,
                })}
              </Text>
              <Text style={[styles.changeLabel, { color: theme.colors.textMuted }]}>
                {monthChange === null
                  ? t('monthly.previousUnavailable')
                  : t('monthly.changeFromPrevious', {
                      count: monthChange > 0 ? `+${monthChange}` : monthChange,
                    })}
              </Text>
            </View>

            <MonthlyCalendar days={statistics.days} startsOnWeekday={statistics.startsOnWeekday} t={t} theme={theme} />

            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('monthly.completedRoutineDays')}</Text>
              <Text style={[styles.completedDaysValue, { color: theme.colors.primary }]}>
                {t('monthly.completedRoutineDaysValue', { count: statistics.completedRoutineDayCount })}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('monthly.planCompletion')}</Text>
              {statistics.planStatistics.map((planStatistic) => (
                <MonthlyPlanRow key={planStatistic.planId} planStatistic={planStatistic} t={t} theme={theme} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MonthNavigation({
  canGoForward,
  label,
  onNext,
  onPrevious,
  t,
  theme,
}: {
  canGoForward: boolean;
  label: string;
  onNext: () => void;
  onPrevious: () => void;
  t: TFunction<'statistics'>;
  theme: AppTheme;
}) {
  return (
    <View style={[styles.monthNavigation, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Pressable
        accessibilityLabel={t('monthly.previousMonth')}
        accessibilityRole="button"
        onPress={onPrevious}
        style={({ pressed }) => [styles.monthButton, { opacity: pressed ? 0.72 : 1 }]}
      >
        <Text style={[styles.monthButtonLabel, { color: theme.colors.primary }]}>‹</Text>
      </Pressable>
      <Text accessibilityRole="header" style={[styles.monthLabel, { color: theme.colors.text }]}>{label}</Text>
      <Pressable
        accessibilityLabel={t('monthly.nextMonth')}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canGoForward }}
        disabled={!canGoForward}
        onPress={onNext}
        style={({ pressed }) => [styles.monthButton, { opacity: pressed || !canGoForward ? 0.4 : 1 }]}
      >
        <Text style={[styles.monthButtonLabel, { color: theme.colors.primary }]}>›</Text>
      </Pressable>
    </View>
  );
}

function MonthlyCalendar({
  days,
  startsOnWeekday,
  t,
  theme,
}: {
  days: readonly MonthlyStatisticDay[];
  startsOnWeekday: number;
  t: TFunction<'statistics'>;
  theme: AppTheme;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('monthly.calendar')}</Text>
      <View style={styles.weekdayRow}>
        {WEEKDAY_KEYS.map((weekday) => (
          <Text key={weekday} style={[styles.weekdayLabel, { color: theme.colors.textMuted }]}>
            {t(`monthly.weekdays.${weekday}`)}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {Array.from({ length: startsOnWeekday }, (_, index) => <View key={`blank-${index}`} style={styles.calendarCell} />)}
        {days.map((day) => <MonthlyCalendarCell day={day} key={day.routineDay} t={t} theme={theme} />)}
      </View>
    </View>
  );
}

function MonthlyCalendarCell({
  day,
  t,
  theme,
}: {
  day: MonthlyStatisticDay;
  t: TFunction<'statistics'>;
  theme: AppTheme;
}) {
  const dayNumber = day.routineDay.slice(-2).replace(/^0/, '');
  const value = day.scheduledCount === 0
    ? t('monthly.restDay')
    : t('monthly.dailyRate', { completed: day.completedCount, scheduled: day.scheduledCount });
  const isComplete = day.completionRate === 100;

  return (
    <View
      accessibilityLabel={t('monthly.dayAccessibilityLabel', { date: day.routineDay, value })}
      style={styles.calendarCell}
    >
      <View style={[
        styles.calendarCellInner,
        {
          backgroundColor: day.scheduledCount === 0
            ? theme.colors.background
            : isComplete ? theme.colors.primary : theme.colors.border,
        },
      ]}>
        <Text style={[styles.calendarDayNumber, { color: isComplete ? theme.colors.onPrimary : theme.colors.text }]}>{dayNumber}</Text>
        <Text style={[styles.calendarDayValue, { color: isComplete ? theme.colors.onPrimary : theme.colors.textMuted }]}>
          {day.scheduledCount === 0 ? '—' : `${day.completionRate}%`}
        </Text>
      </View>
    </View>
  );
}

function MonthlyPlanRow({
  planStatistic,
  t,
  theme,
}: {
  planStatistic: MonthlyPlanStatistic;
  t: TFunction<'statistics'>;
  theme: AppTheme;
}) {
  return (
    <View
      accessibilityLabel={t('monthly.planAccessibilityLabel', {
        completed: planStatistic.completedCount,
        rate: planStatistic.completionRate,
        scheduled: planStatistic.scheduledCount,
        title: planStatistic.planTitle,
      })}
      style={styles.planRow}
    >
      <View style={styles.planCopy}>
        <Text numberOfLines={1} style={[styles.planTitle, { color: theme.colors.text }]}>{planStatistic.planTitle}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t('monthly.planCount', {
            completed: planStatistic.completedCount,
            scheduled: planStatistic.scheduledCount,
          })}
        </Text>
      </View>
      <Text style={[styles.planRate, { color: theme.colors.primary }]}>{t('rateValue', { count: planStatistic.completionRate })}</Text>
    </View>
  );
}

function formatMonthLabel(monthKey: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${monthKey}-01T12:00:00.000Z`));
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  headerCopy: { flex: 1, gap: spacing.xs },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  outlineButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  outlineButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  monthNavigation: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  monthButton: { alignItems: 'center', justifyContent: 'center', minHeight: touchTarget.minimum, minWidth: touchTarget.minimum },
  monthButtonLabel: { fontSize: typography.size.title, lineHeight: typography.lineHeight.title },
  monthLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  stateContainer: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center', minHeight: 220, padding: spacing.lg },
  stateText: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  statistics: { gap: spacing.md },
  rateCard: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.lg },
  label: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  rate: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  changeLabel: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  card: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  completedDaysValue: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: { flex: 1, fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { padding: 2, width: '14.285714%' },
  calendarCellInner: { alignItems: 'center', borderRadius: radii.sm, gap: 1, justifyContent: 'center', minHeight: 44, paddingVertical: spacing.xs },
  calendarDayNumber: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  calendarDayValue: { fontSize: 10, lineHeight: 12 },
  planRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: touchTarget.minimum },
  planCopy: { flex: 1, gap: spacing.xs },
  planTitle: { fontSize: typography.size.body, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.body },
  planRate: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
});
