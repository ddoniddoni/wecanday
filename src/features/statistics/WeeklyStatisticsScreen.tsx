import type { SupabaseClient } from '@supabase/supabase-js';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { type ComponentProps, useCallback, useEffect, useState } from 'react';
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
import { JourneyHeader } from '@/components/JourneyHeader';
import type { PrimaryNavigationActions } from '@/components/PrimaryNavigation';
import type { CompanionId } from '@/features/companion/domain/companions';
import { loadCompanionProgress } from '@/features/companion/services/companionProgressService';
import { getCurrentRoutineDayWindow, type RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import type { WeeklyStatisticDay, WeeklyStatistics } from '@/features/statistics/domain/weeklyStatistics';
import { loadWeeklyStatistics } from '@/features/statistics/services/weeklyStatisticsService';
import { StatisticsPeriodTabs } from '@/features/statistics/StatisticsPeriodTabs';
import type { Database } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

type WeeklyStatisticsScreenProps = {
  client: SupabaseClient<Database>;
  companionId?: CompanionId;
  onBack: () => void;
  onOpenAnnual?: () => void;
  onOpenMonthly?: () => void;
  primaryNavigation?: PrimaryNavigationActions;
  routineDayConfig: RoutineDayConfig;
  userId: string;
};

export function WeeklyStatisticsScreen({
  client,
  companionId = 'sprout',
  onBack,
  onOpenAnnual,
  onOpenMonthly,
  primaryNavigation,
  routineDayConfig,
  userId,
}: WeeklyStatisticsScreenProps) {
  const { i18n, t } = useTranslation('statistics');
  const { theme } = useTheme();
  const [statistics, setStatistics] = useState<WeeklyStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [experience, setExperience] = useState(0);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const [nextStatistics, companionProgress] = await Promise.all([
        loadWeeklyStatistics(
          client,
          userId,
          getCurrentRoutineDayWindow(routineDayConfig).key,
          routineDayConfig,
        ),
        loadCompanionProgress(client).catch(() => null),
      ]);

      setStatistics(nextStatistics);
      if (companionProgress) setExperience(companionProgress.experience);
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
        <JourneyHeader companionId={companionId} experience={experience} />
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t('title')}
          </Text>
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

        {onOpenMonthly && onOpenAnnual ? (
          <StatisticsPeriodTabs
            activePeriod="week"
            onSelectPeriod={(period) => {
              if (period === 'month') onOpenMonthly();
              if (period === 'year') onOpenAnnual();
            }}
          />
        ) : null}

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
            <View style={[styles.summary, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.summaryRateRow}>
                <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>{t('completionRate')}</Text>
                <Text style={[styles.rate, { color: theme.colors.text }]}>
                  {t('rateValue', { count: completionRate })}
                </Text>
              </View>
              <View style={[styles.summaryTrack, { backgroundColor: palette.lightContainerHigh }]}>
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
              <View style={styles.weekDays}>
                {statistics.days.map((day) => (
                  <WeeklyDayCircle day={day} key={day.routineDay} locale={i18n.language} t={t} theme={theme} />
                ))}
              </View>
            </View>

            <View accessibilityRole="summary" style={styles.insightGrid}>
              <StreakSummaryItem
                count={statistics.currentDailyStreak}
                icon="local-fire-department"
                label={t('currentStreak')}
                t={t}
                theme={theme}
              />
              <StreakSummaryItem
                count={statistics.highestDailyStreak}
                icon="emoji-events"
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

function WeeklyDayCircle({
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
  return (
    <View
      accessibilityLabel={t('dailyAccessibilityLabel', {
        date: formatWeeklyDate(day.routineDay, locale, 'full'),
        value: accessibilityValue,
      })}
      style={styles.dayColumn}
    >
      <Text numberOfLines={1} style={[styles.dayKey, { color: isSunday(day.routineDay) ? palette.error : theme.colors.textMuted }]}>
        {formatWeeklyDate(day.routineDay, locale, 'weekday')}
      </Text>
      <View
        style={[
          styles.dayCircle,
          {
            backgroundColor: day.completionRate === 100 ? theme.colors.primary : palette.lightContainerHigh,
            borderColor: day.completionRate === 100 ? palette.lightPrimaryShadow : theme.colors.border,
          },
        ]}
      >
        {day.completionRate === 100 ? (
          <MaterialIcons color={theme.colors.onPrimary} name="check" size={20} />
        ) : (
          <Text style={[styles.dayCircleValue, { color: theme.colors.textMuted }]}>
            {isRestDay ? '·' : day.completedCount}
          </Text>
        )}
      </View>
    </View>
  );
}

function StreakSummaryItem({
  count,
  icon,
  label,
  t,
  theme,
}: {
  count: number;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  t: TFunction<'statistics'>;
  theme: AppTheme;
}) {
  return (
    <View style={[styles.streakItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[styles.insightIcon, { backgroundColor: palette.lightContainer }]}>
        <MaterialIcons color={theme.colors.accent} name={icon} size={22} />
      </View>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.streakValue, { color: theme.colors.text }]}>
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
  variant: 'full' | 'weekday',
): string {
  const isKorean = locale.startsWith('ko');
  const formatPattern = variant === 'weekday'
    ? 'EEEEE'
    : isKorean ? 'yyyy년 M월 d일 EEEE' : 'EEEE, MMMM d, yyyy';

  return format(toUtcDate(routineDay), formatPattern, { locale: isKorean ? ko : enUS });
}

function isSunday(routineDay: string): boolean {
  return toUtcDate(routineDay).getUTCDay() === 0;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.md, paddingBottom: spacing.xxl, paddingHorizontal: spacing.md },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  title: { fontFamily: typography.family.extraBold, fontSize: 24, lineHeight: 32 },
  backButton: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  stateContainer: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center', minHeight: 220, padding: spacing.lg },
  stateText: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  statistics: { gap: spacing.md },
  summary: { borderBottomWidth: 4, borderRadius: radii.md, borderWidth: 2, gap: spacing.sm, padding: spacing.md },
  summaryRateRow: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  summaryTitle: { fontFamily: typography.family.bold, fontSize: 16, lineHeight: 24 },
  summaryTrack: { borderRadius: radii.pill, height: 14, overflow: 'hidden' },
  summaryFill: { borderRadius: radii.pill, height: '100%' },
  summaryDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  label: { fontFamily: typography.family.bold, fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  rate: { fontFamily: typography.family.extraBold, fontSize: 26, lineHeight: 32 },
  card: { borderBottomWidth: 4, borderRadius: radii.md, borderWidth: 2, gap: spacing.md, padding: spacing.md },
  cardTitle: { fontFamily: typography.family.bold, fontSize: 16, lineHeight: 24 },
  dayCircle: { alignItems: 'center', borderBottomWidth: 3, borderRadius: radii.pill, borderWidth: 1, height: 34, justifyContent: 'center', width: 34 },
  dayCircleValue: { fontFamily: typography.family.bold, fontSize: 12, lineHeight: 16 },
  dayColumn: { alignItems: 'center', flex: 1, gap: spacing.xs },
  dayKey: { fontFamily: typography.family.bold, fontSize: 11, lineHeight: 14, textAlign: 'center' },
  insightGrid: { flexDirection: 'row', gap: spacing.sm },
  insightIcon: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  streakItem: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.md, borderWidth: 2, flex: 1, gap: spacing.xs, minHeight: 136, padding: spacing.md },
  streakValue: { fontFamily: typography.family.extraBold, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  weekDays: { flexDirection: 'row', gap: spacing.xs, justifyContent: 'space-between' },
});
