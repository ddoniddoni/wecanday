import type { SupabaseClient } from '@supabase/supabase-js';
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

import {
  getCheckInErrorCode,
  type CheckInErrorCode,
} from '@/features/check-ins/domain/checkInErrors';
import {
  applyPendingCheckInOperations,
  type TodayRoutineItem,
} from '@/features/check-ins/domain/todayRoutines';
import { CompanionHero } from '@/features/companion/CompanionHero';
import { PublicCodeShareCard } from '@/features/friends/PublicCodeShareCard';
import { RoutineDayTiming } from '@/features/routine-day/RoutineDayTiming';
import { TodayStatsSummary } from '@/features/streaks/TodayStatsSummary';
import { loadCurrentDailyStreak } from '@/features/streaks/services/dailyStreakService';
import { synchronizePendingCheckIns } from '@/features/check-ins/services/checkInOutboxService';
import {
  completeCheckIn,
  loadTodayRoutineItems,
  undoCheckIn,
} from '@/features/check-ins/services/checkInService';
import {
  getCurrentRoutineDayWindow,
  systemClock,
  type RoutineDayConfig,
  type RoutineDayWindow,
} from '@/features/routine-day/domain/routineDay';
import type { Database } from '@/lib/supabase/database.types';
import {
  createCheckInOutboxOperation,
  enqueueCheckInOperation,
  loadPendingCheckInOperations,
  removeCheckInOperationsForRoutine,
} from '@/local-db/checkInOutbox';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

const SYNC_INTERVAL_MS = 30_000;

type TodayRoutineScreenProps = {
  client: SupabaseClient<Database>;
  displayName: string;
  hasPlanCreationSuccess: boolean;
  onCreatePlan: () => void;
  onEditRoutine: (item: Pick<TodayRoutineItem, 'id' | 'reminder_minute' | 'schedule_weekdays' | 'title'>) => void;
  onOpenFriendSearch: () => void;
  onOpenPlans: () => void;
  onOpenAnnualStatistics: () => void;
  onOpenAccountSettings: () => void;
  onOpenMonthlyStatistics: () => void;
  onOpenThemes: () => void;
  onOpenWeeklyStatistics: () => void;
  onRoutineCompletionChanged: (
    item: Pick<TodayRoutineItem, 'id' | 'reminder_minute' | 'schedule_weekdays'>,
    isCompleted: boolean,
  ) => void;
  publicCode: string;
  routineDayConfig: RoutineDayConfig;
  userId: string;
};

export function TodayRoutineScreen({
  client,
  displayName,
  hasPlanCreationSuccess,
  onCreatePlan,
  onEditRoutine,
  onOpenFriendSearch,
  onOpenPlans,
  onOpenAnnualStatistics,
  onOpenAccountSettings,
  onOpenMonthlyStatistics,
  onOpenThemes,
  onOpenWeeklyStatistics,
  onRoutineCompletionChanged,
  publicCode,
  routineDayConfig,
  userId,
}: TodayRoutineScreenProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const [routineDayWindow, setRoutineDayWindow] = useState<RoutineDayWindow>(() =>
    getCurrentRoutineDayWindow(routineDayConfig),
  );
  const [items, setItems] = useState<TodayRoutineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutatingRoutineIds, setMutatingRoutineIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [errorCode, setErrorCode] = useState<CheckInErrorCode | null>(null);
  const [companionReactionId, setCompanionReactionId] = useState(0);
  const [dailyStreak, setDailyStreak] = useState<number | null>(null);
  const [isDailyStreakLoading, setIsDailyStreakLoading] = useState(true);

  const refresh = useCallback(
    async (showLoading: boolean) => {
      const nextRoutineDayWindow = getCurrentRoutineDayWindow(routineDayConfig);

      setRoutineDayWindow(nextRoutineDayWindow);
      setErrorCode(null);
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setIsDailyStreakLoading(true);

      try {
        await synchronizePendingCheckIns(client, userId, systemClock.now());
        const [loadedItems, pendingOperations] = await Promise.all([
          loadTodayRoutineItems(client, userId, nextRoutineDayWindow.key),
          loadPendingCheckInOperations(userId, nextRoutineDayWindow.key),
        ]);

        setItems(
          applyPendingCheckInOperations(
            loadedItems,
            pendingOperations.map((operation) => ({
              createdAt: operation.createdAt,
              kind: operation.kind,
              routineItemId: operation.routineItemId,
            })),
          ),
        );

        try {
          const loadedDailyStreak = await loadCurrentDailyStreak(
            client,
            userId,
            nextRoutineDayWindow.key,
            routineDayConfig,
          );

          setDailyStreak(loadedDailyStreak);
        } catch {
          setDailyStreak(null);
        }
      } catch (error) {
        setErrorCode(getCheckInErrorCode(error));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsDailyStreakLoading(false);
      }
    },
    [client, routineDayConfig, userId],
  );

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refresh(true);
    }, 0);

    const interval = setInterval(() => {
      void refresh(false);
    }, SYNC_INTERVAL_MS);

    return () => {
      clearTimeout(initialRefresh);
      clearInterval(interval);
    };
  }, [refresh]);

  async function handleToggle(item: TodayRoutineItem) {
    const isComplete = item.completedAt !== null;
    const completedCountBeforeToggle = items.filter(
      (candidate) => candidate.completedAt !== null,
    ).length;
    const isDailyStreakCompleteBeforeToggle =
      items.length > 0 && completedCountBeforeToggle === items.length;
    const occurredAt = systemClock.now().toISOString();
    const operation = createCheckInOutboxOperation({
      kind: isComplete ? 'undo' : 'complete',
      occurredAt,
      routineDay: routineDayWindow.key,
      routineItemId: item.id,
      userId,
    });

    setErrorCode(null);
    setMutatingRoutineIds((previousIds) => new Set(previousIds).add(item.id));
    setItems((previousItems) =>
      previousItems.map((candidate) =>
        candidate.id === item.id
          ? {
              ...candidate,
              completedAt: isComplete ? null : occurredAt,
              syncStatus: 'syncing',
            }
          : candidate,
      ),
    );
    if (!isComplete) {
      setCompanionReactionId((previousReactionId) => previousReactionId + 1);
    }
    if (!isComplete && completedCountBeforeToggle + 1 === items.length) {
      setDailyStreak((previousStreak) =>
        previousStreak === null ? null : previousStreak + 1,
      );
    }
    if (isComplete && isDailyStreakCompleteBeforeToggle) {
      setDailyStreak((previousStreak) =>
        previousStreak === null ? null : Math.max(0, previousStreak - 1),
      );
    }
    onRoutineCompletionChanged(item, !isComplete);

    try {
      const mutation = {
        idempotencyKey: operation.idempotencyKey,
        occurredAt: operation.occurredAt,
        routineDay: operation.routineDay,
        routineItemId: operation.routineItemId,
        source: 'online' as const,
      };

      if (operation.kind === 'complete') {
        await completeCheckIn(client, mutation);
      } else {
        await undoCheckIn(client, mutation);
      }

      await removeCheckInOperationsForRoutine(userId, item.id, routineDayWindow.key);
      setItems((previousItems) =>
        previousItems.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, syncStatus: null }
            : candidate,
        ),
      );
    } catch {
      await enqueueCheckInOperation(operation);
      setItems((previousItems) =>
        previousItems.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, syncStatus: 'queued' }
            : candidate,
        ),
      );
    } finally {
      setMutatingRoutineIds((previousIds) => {
        const nextIds = new Set(previousIds);

        nextIds.delete(item.id);
        return nextIds;
      });
    }
  }

  const completedCount = items.filter((item) => item.completedAt !== null).length;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
              {t('eyebrow', { name: displayName })}
            </Text>
            <View style={styles.titleRow}>
              <Text
                accessibilityRole="header"
                style={[styles.title, { color: theme.colors.text }]}
              >
                {t('title')}
              </Text>
              <Pressable
                accessibilityLabel={t('openAccountSettings')}
                accessibilityRole="button"
                onPress={onOpenAccountSettings}
                style={({ pressed }) => [
                  styles.accountButton,
                  {
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text style={[styles.accountButtonLabel, { color: theme.colors.text }]}>
                  •••
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel={t('openPlans')}
              accessibilityRole="button"
              onPress={onOpenPlans}
              style={({ pressed }) => [
                styles.primaryUtilityButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.utilityButtonLabel, { color: theme.colors.onPrimary }]}>
                {t('openPlans')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t('openThemes')}
              accessibilityRole="button"
              onPress={onOpenThemes}
              style={({ pressed }) => [
                styles.utilityButton,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.utilityButtonLabel, { color: theme.colors.text }]}>
                {t('openThemes')}
              </Text>
            </Pressable>
          </View>
        </View>

        <CompanionHero
          completedCount={completedCount}
          reactionId={companionReactionId}
          routineDay={routineDayWindow.key}
          totalCount={items.length}
        />
        <RoutineDayTiming config={routineDayConfig} />
        <TodayStatsSummary
          completedCount={completedCount}
          dailyStreak={dailyStreak}
          isDailyStreakLoading={isDailyStreakLoading}
          totalCount={items.length}
        />

        {hasPlanCreationSuccess ? (
          <Text style={[styles.success, { color: theme.colors.primary }]}>
            {t('planCreated')}
          </Text>
        ) : null}
        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator accessibilityLabel={t('loading')} color={theme.colors.primary} />
            <Text style={[styles.stateText, { color: theme.colors.textMuted }]}>
              {t('loading')}
            </Text>
          </View>
        ) : null}

        {!isLoading && errorCode ? (
          <View style={styles.stateContainer}>
            <Text accessibilityRole="alert" style={[styles.stateText, { color: theme.colors.text }]}>
              {t(`errors.${errorCode}`)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void refresh(false)}
              style={({ pressed }) => [
                styles.retryButton,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed || isRefreshing ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.retryLabel, { color: theme.colors.text }]}>
                {t('retry')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !errorCode && items.length === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={[styles.stateText, { color: theme.colors.text }]}>
              {t('emptyTitle')}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              {t('emptyDescription')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onCreatePlan}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.primaryButtonLabel, { color: theme.colors.onPrimary }]}>
                {t('createPlan')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !errorCode && items.length > 0 ? (
          <View style={styles.list}>
            <View style={styles.sectionHeader}>
              <Text
                accessibilityRole="header"
                style={[styles.sectionTitle, { color: theme.colors.text }]}
              >
                {t('routines.title')}
              </Text>
              <Text style={[styles.sectionMeta, { color: theme.colors.textMuted }]}>
                {t('routines.count', { count: items.length })}
              </Text>
            </View>
            {items.map((item) => {
              const isComplete = item.completedAt !== null;
              const isMutating = mutatingRoutineIds.has(item.id);
              const actionLabel = isComplete
                ? t('undoItem', { title: item.title })
                : t('completeItem', { title: item.title });

              return (
                <View
                  key={item.id}
                  style={[
                    styles.routineItem,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: isComplete ? theme.colors.primary : theme.colors.border,
                      opacity: isMutating ? 0.72 : 1,
                    },
                  ]}
                >
                  <Pressable
                    accessibilityLabel={actionLabel}
                    accessibilityRole="button"
                    accessibilityState={{ busy: isMutating, checked: isComplete }}
                    disabled={isMutating}
                    onPress={() => void handleToggle(item)}
                    style={styles.toggleArea}
                  >
                    <View
                      style={[
                        styles.checkmark,
                        {
                          backgroundColor: isComplete
                            ? theme.colors.primary
                            : theme.colors.background,
                          borderColor: isComplete ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.checkmarkLabel,
                          { color: isComplete ? theme.colors.onPrimary : theme.colors.textMuted },
                        ]}
                      >
                        {isComplete ? '✓' : ''}
                      </Text>
                    </View>
                    <View style={styles.itemCopy}>
                      <Text
                        style={[
                          styles.itemTitle,
                          {
                            color: theme.colors.text,
                            textDecorationLine: isComplete ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                      {item.syncStatus ? (
                        <Text style={[styles.syncLabel, { color: theme.colors.textMuted }]}>
                          {t(`sync.${item.syncStatus}`)}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={t('editItem', { title: item.title })}
                    accessibilityRole="button"
                    onPress={() => onEditRoutine(item)}
                    style={[styles.editButton, { borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.editButtonLabel, { color: theme.colors.text }]}>
                      {t('edit')}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
            <Pressable
              accessibilityRole="button"
              onPress={onCreatePlan}
              style={({ pressed }) => [
                styles.addButton,
                { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.addButtonLabel, { color: theme.colors.text }]}>
                {t('addRoutine')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.secondarySection}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: theme.colors.text }]}
          >
            {t('sections.insights')}
          </Text>
          <View style={styles.statisticsActions}>
            <Pressable
              accessibilityLabel={t('openWeeklyStatistics')}
              accessibilityRole="button"
              onPress={onOpenWeeklyStatistics}
              style={({ pressed }) => [
                styles.statisticsButton,
                { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.statisticsButtonLabel, { color: theme.colors.text }]}>
                {t('openWeeklyStatistics')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t('openMonthlyStatistics')}
              accessibilityRole="button"
              onPress={onOpenMonthlyStatistics}
              style={({ pressed }) => [
                styles.statisticsButton,
                { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.statisticsButtonLabel, { color: theme.colors.text }]}>
                {t('openMonthlyStatistics')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t('openAnnualStatistics')}
              accessibilityRole="button"
              onPress={onOpenAnnualStatistics}
              style={({ pressed }) => [
                styles.statisticsButton,
                { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.statisticsButtonLabel, { color: theme.colors.text }]}>
                {t('openAnnualStatistics')}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.secondarySection}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: theme.colors.text }]}
          >
            {t('sections.friends')}
          </Text>
          <PublicCodeShareCard onFindFriend={onOpenFriendSearch} publicCode={publicCode} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.lg, paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { gap: spacing.md },
  headerCopy: { gap: spacing.xs },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 0.4, lineHeight: typography.lineHeight.caption },
  title: { flexShrink: 1, fontSize: typography.size.title, fontWeight: typography.weight.bold, letterSpacing: -0.4, lineHeight: typography.lineHeight.title },
  accountButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum },
  accountButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, includeFontPadding: false, letterSpacing: 1, lineHeight: typography.size.body },
  utilityButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  primaryUtilityButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  utilityButtonLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  success: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  stateContainer: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center', minHeight: 180, padding: spacing.lg },
  stateText: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  primaryButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  primaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  retryButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  retryLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  statisticsActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statisticsButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, flexGrow: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  statisticsButtonLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  secondarySection: { gap: spacing.md },
  sectionHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  sectionMeta: { fontSize: typography.size.caption, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.caption },
  list: { gap: spacing.sm },
  routineItem: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 80, padding: spacing.md },
  toggleArea: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.md },
  checkmark: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum },
  checkmarkLabel: { fontSize: typography.size.body, includeFontPadding: false, lineHeight: typography.size.body, textAlign: 'center' },
  itemCopy: { flex: 1, gap: spacing.xs },
  itemTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  syncLabel: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  editButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  editButtonLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  addButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  addButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
});
