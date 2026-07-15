import type { SupabaseClient } from '@supabase/supabase-js';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppTabScreen } from '@/components/AppTabScreen';
import type { PrimaryNavigationActions } from '@/components/PrimaryNavigation';
import { getCurrentRoutineDayWindow, type RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import { getAdjacentYear, type AnnualMonthlyTrend, type AnnualStatisticDay, type AnnualStatistics } from '@/features/statistics/domain/annualStatistics';
import { loadAnnualStatistics } from '@/features/statistics/services/annualStatisticsService';
import { StatisticsPeriodTabs } from '@/features/statistics/StatisticsPeriodTabs';
import type { Database } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';
import type { AppTheme } from '@/theme/types';

type AnnualStatisticsScreenProps = { client: SupabaseClient<Database>; onBack: () => void; onOpenMonthly?: () => void; onOpenWeekly?: () => void; primaryNavigation?: PrimaryNavigationActions; routineDayConfig: RoutineDayConfig; userId: string };

export function AnnualStatisticsScreen({ client, onBack, onOpenMonthly, onOpenWeekly, primaryNavigation, routineDayConfig, userId }: AnnualStatisticsScreenProps) {
  const { t } = useTranslation('statistics');
  const { theme } = useTheme();
  const currentYear = getCurrentRoutineDayWindow(routineDayConfig).key.slice(0, 4);
  const [year, setYear] = useState(currentYear);
  const [statistics, setStatistics] = useState<AnnualStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const refresh = useCallback(async (selectedYear: string) => {
    setIsLoading(true);
    setHasError(false);
    try {
      setStatistics(await loadAnnualStatistics(client, userId, selectedYear, routineDayConfig));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [client, routineDayConfig, userId]);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(year), 0);
    return () => clearTimeout(timer);
  }, [refresh, year]);

  const completionRate = statistics && statistics.scheduledCount > 0
    ? Math.round((statistics.completedCount / statistics.scheduledCount) * 100)
    : null;

  return (
    <AppTabScreen
      activeTab={primaryNavigation ? 'statistics' : undefined}
      navigation={primaryNavigation}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.64 : 1 }]}>
            <MaterialIcons color={theme.colors.text} name="arrow-back" size={24} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>{t('annual.eyebrow')}</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{t('annual.title')}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        {onOpenWeekly && onOpenMonthly ? <StatisticsPeriodTabs activePeriod="year" onSelectPeriod={(period) => { if (period === 'week') onOpenWeekly(); if (period === 'month') onOpenMonthly(); }} /> : null}
        <YearNavigation canGoForward={year < currentYear} onNext={() => setYear((value) => getAdjacentYear(value, 1))} onPrevious={() => setYear((value) => getAdjacentYear(value, -1))} t={t} theme={theme} year={year} />
        {isLoading ? <LoadingState label={t('annual.loading')} theme={theme} /> : null}
        {!isLoading && hasError ? <ErrorState onRetry={() => void refresh(year)} t={t} theme={theme} /> : null}
        {!isLoading && !hasError && statistics && statistics.scheduledCount === 0 ? <EmptyState t={t} theme={theme} /> : null}
        {!isLoading && !hasError && statistics && statistics.scheduledCount > 0 ? (
          <View accessibilityLabel={t('annual.accessibilitySummary', { completed: statistics.completedCount, highestStreak: statistics.highestDailyStreak, rate: completionRate, scheduled: statistics.scheduledCount, totalCheckIns: statistics.totalCheckInCount })} style={styles.statistics}>
            <View style={[styles.rateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>{t('annual.completionRate')}</Text>
              <Text style={[styles.rate, { color: theme.colors.text }]}>{t('rateValue', { count: completionRate })}</Text>
              <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('annual.completionCount', { completed: statistics.completedCount, scheduled: statistics.scheduledCount })}</Text>
            </View>
            <View style={styles.summaryRow}>
              <SummaryCard label={t('annual.totalCheckIns')} value={t('annual.totalCheckInsValue', { count: statistics.totalCheckInCount })} theme={theme} />
              <SummaryCard label={t('annual.highestStreak')} value={t('annual.highestStreakValue', { count: statistics.highestDailyStreak })} theme={theme} />
            </View>
            <AnnualHeatmap days={statistics.days} t={t} theme={theme} />
            <MonthlyTrendList trends={statistics.monthlyTrends} t={t} theme={theme} />
          </View>
        ) : null}
      </ScrollView>
    </AppTabScreen>
  );
}

function YearNavigation({ canGoForward, onNext, onPrevious, t, theme, year }: { canGoForward: boolean; onNext: () => void; onPrevious: () => void; t: TFunction<'statistics'>; theme: AppTheme; year: string }) {
  return <View style={[styles.navigation, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
    <Pressable accessibilityLabel={t('annual.previousYear')} accessibilityRole="button" onPress={onPrevious} style={styles.navigationButton}><Text style={[styles.navigationButtonLabel, { color: theme.colors.text }]}>‹</Text></Pressable>
    <Text accessibilityRole="header" style={[styles.yearLabel, { color: theme.colors.text }]}>{year}</Text>
    <Pressable accessibilityLabel={t('annual.nextYear')} accessibilityRole="button" accessibilityState={{ disabled: !canGoForward }} disabled={!canGoForward} onPress={onNext} style={[styles.navigationButton, { opacity: canGoForward ? 1 : 0.4 }]}><Text style={[styles.navigationButtonLabel, { color: theme.colors.text }]}>›</Text></Pressable>
  </View>;
}

function LoadingState({ label, theme }: { label: string; theme: AppTheme }) { return <View style={styles.state}><ActivityIndicator accessibilityLabel={label} color={theme.colors.primary} /><Text style={[styles.stateText, { color: theme.colors.textMuted }]}>{label}</Text></View>; }
function ErrorState({ onRetry, t, theme }: { onRetry: () => void; t: TFunction<'statistics'>; theme: AppTheme }) { return <View style={styles.state}><Text accessibilityRole="alert" style={[styles.stateText, { color: theme.colors.text }]}>{t('annual.error')}</Text><Pressable accessibilityRole="button" onPress={onRetry} style={[styles.outlineButton, { borderColor: theme.colors.border }]}><Text style={[styles.outlineButtonLabel, { color: theme.colors.text }]}>{t('retry')}</Text></Pressable></View>; }
function EmptyState({ t, theme }: { t: TFunction<'statistics'>; theme: AppTheme }) { return <View style={styles.state}><Text style={[styles.stateText, { color: theme.colors.text }]}>{t('annual.emptyTitle')}</Text><Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('annual.emptyDescription')}</Text></View>; }
function SummaryCard({ label, theme, value }: { label: string; theme: AppTheme; value: string }) { return <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text><Text style={[styles.summaryValue, { color: theme.colors.text }]}>{value}</Text></View>; }

function AnnualHeatmap({ days, t, theme }: { days: readonly AnnualStatisticDay[]; t: TFunction<'statistics'>; theme: AppTheme }) {
  return <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('annual.heatmap')}</Text><View style={styles.heatmap}>{Array.from({ length: 12 }, (_, index) => <AnnualMonthGrid days={days.filter((day) => day.routineDay.slice(5, 7) === String(index + 1).padStart(2, '0'))} key={index} month={index + 1} t={t} theme={theme} />)}</View></View>;
}

function AnnualMonthGrid({ days, month, t, theme }: { days: readonly AnnualStatisticDay[]; month: number; t: TFunction<'statistics'>; theme: AppTheme }) {
  return <View accessibilityLabel={t('annual.monthAccessibilityLabel', { month, value: createMonthValue(days, t) })} style={styles.monthGrid}><Text style={[styles.monthGridLabel, { color: theme.colors.textMuted }]}>{month}</Text><View style={styles.monthCells}>{days.map((day) => <View key={day.routineDay} style={[styles.monthCell, { backgroundColor: day.completionRate === 100 ? theme.colors.primary : day.completionRate === null ? theme.colors.background : theme.colors.border }]} />)}</View></View>;
}

function MonthlyTrendList({ t, theme, trends }: { t: TFunction<'statistics'>; theme: AppTheme; trends: readonly AnnualMonthlyTrend[] }) { return <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('annual.monthlyTrend')}</Text>{trends.map((trend) => <View key={trend.monthKey} style={styles.trendRow}><Text style={[styles.trendMonth, { color: theme.colors.textMuted }]}>{trend.monthKey.slice(5)}</Text><View style={[styles.trendTrack, { backgroundColor: theme.colors.background }]}><View style={[styles.trendFill, { backgroundColor: theme.colors.primary, width: `${trend.completionRate ?? 0}%` }]} /></View><Text style={[styles.trendValue, { color: theme.colors.text }]}>{trend.completionRate === null ? t('annual.restMonth') : t('rateValue', { count: trend.completionRate })}</Text></View>)}</View>; }
function createMonthValue(days: readonly AnnualStatisticDay[], t: TFunction<'statistics'>): string { const scheduled = days.reduce((sum, day) => sum + day.scheduledCount, 0); const completed = days.reduce((sum, day) => sum + day.completedCount, 0); return scheduled === 0 ? t('annual.restMonth') : t('rateValue', { count: Math.round((completed / scheduled) * 100) }); }

const styles = StyleSheet.create({ backButton: { alignItems: 'center', height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum }, content: { flexGrow: 1, gap: spacing.md, paddingBottom: spacing.xxl, paddingHorizontal: spacing.md }, header: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }, headerCopy: { alignItems: 'center', flex: 1, gap: 2 }, headerSpacer: { width: touchTarget.minimum }, eyebrow: { fontFamily: typography.family.bold, fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption }, title: { fontFamily: typography.family.extraBold, fontSize: 24, lineHeight: 32 }, outlineButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md }, outlineButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body }, navigation: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm }, navigationButton: { alignItems: 'center', justifyContent: 'center', minHeight: touchTarget.minimum, minWidth: touchTarget.minimum }, navigationButtonLabel: { fontSize: typography.size.title, lineHeight: typography.lineHeight.title }, yearLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body }, state: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center', minHeight: 220, padding: spacing.lg }, stateText: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' }, description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' }, statistics: { gap: spacing.md }, rateCard: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.lg }, label: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption }, rate: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title }, summaryRow: { flexDirection: 'row', gap: spacing.md }, summaryCard: { borderRadius: radii.md, borderWidth: 1, flex: 1, gap: spacing.xs, padding: spacing.md }, summaryValue: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body }, card: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, cardTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body }, heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, monthGrid: { gap: 2, width: '30%' }, monthGridLabel: { fontSize: 10, fontWeight: typography.weight.bold, lineHeight: 12 }, monthCells: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 }, monthCell: { borderRadius: 2, height: 8, width: 8 }, trendRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: touchTarget.minimum }, trendMonth: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, width: 20 }, trendTrack: { borderRadius: radii.pill, flex: 1, height: 8, overflow: 'hidden' }, trendFill: { borderRadius: radii.pill, height: '100%' }, trendValue: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption, textAlign: 'right', width: 58 } });
