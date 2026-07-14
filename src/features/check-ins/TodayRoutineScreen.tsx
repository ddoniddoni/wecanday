import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getCheckInErrorCode,
  type CheckInErrorCode,
} from '@/features/check-ins/domain/checkInErrors';
import {
  applyPendingCheckInOperations,
  type TodayRoutineItem,
} from '@/features/check-ins/domain/todayRoutines';
import { AppTabScreen } from '@/components/AppTabScreen';
import { CompletionFeedback } from '@/features/check-ins/CompletionFeedback';
import { MicroGoalCard } from '@/features/check-ins/MicroGoalCard';
import {
  EXPERIENCE_PER_ROUTINE_COMPLETION,
  getCompanionProgressForExperience,
  type CompanionProgress,
} from '@/features/companion/domain/progression';
import { CompanionHero } from '@/features/companion/CompanionHero';
import type { CompanionId } from '@/features/companion/domain/companions';
import { RoutineDayTiming } from '@/features/routine-day/RoutineDayTiming';
import { StreakMomentCard } from '@/features/streaks/StreakMomentCard';
import { TodayStatsSummary } from '@/features/streaks/TodayStatsSummary';
import { synchronizePendingCheckIns } from '@/features/check-ins/services/checkInOutboxService';
import {
  completeCheckIn,
  loadTodayRoutineItems,
  undoCheckIn,
} from '@/features/check-ins/services/checkInService';
import { playRoutineCompletionHaptic } from '@/features/check-ins/services/completionHaptics';
import { loadCompanionProgress } from '@/features/companion/services/companionProgressService';
import { loadCurrentDailyStreak } from '@/features/streaks/services/dailyStreakService';
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
import { useReducedMotion } from 'react-native-reanimated';

const SYNC_INTERVAL_MS = 30_000;
const COMPLETION_FEEDBACK_DURATION_MS = 2_000;

type CompletionFeedbackState = {
  completedCount: number;
  experienceGained: number;
  hasLevelUp: boolean;
  id: number;
  level: number;
  totalCount: number;
};

type TodayRoutineScreenProps = {
  client: SupabaseClient<Database>;
  companionId: CompanionId;
  displayName: string;
  hasPlanCreationSuccess: boolean;
  isHapticsEnabled: boolean;
  onCreatePlan: () => void;
  onEditRoutine: (item: Pick<TodayRoutineItem, 'id' | 'reminder_minute' | 'schedule_weekdays' | 'title'>) => void;
  onOpenPlans: () => void;
  onOpenProfile: () => void;
  onOpenStatistics: () => void;
  onRoutineCompletionChanged: (
    item: Pick<TodayRoutineItem, 'id' | 'reminder_minute' | 'schedule_weekdays'>,
    isCompleted: boolean,
  ) => void;
  routineDayConfig: RoutineDayConfig;
  userId: string;
};

export function TodayRoutineScreen({
  client,
  companionId,
  displayName,
  hasPlanCreationSuccess,
  isHapticsEnabled,
  onCreatePlan,
  onEditRoutine,
  onOpenPlans,
  onOpenProfile,
  onOpenStatistics,
  onRoutineCompletionChanged,
  routineDayConfig,
  userId,
}: TodayRoutineScreenProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
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
  const initialCompanionProgress = getCompanionProgressForExperience(0);
  const [companionProgress, setCompanionProgress] = useState<CompanionProgress>(
    initialCompanionProgress,
  );
  const companionProgressRef = useRef(initialCompanionProgress);
  const [completionFeedback, setCompletionFeedback] =
    useState<CompletionFeedbackState | null>(null);
  const completionFeedbackIdRef = useRef(0);
  const routineListOffsetRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [highlightedRoutineId, setHighlightedRoutineId] = useState<string | null>(null);
  const [dailyStreak, setDailyStreak] = useState<number | null>(null);
  const dailyStreakRef = useRef<number | null>(null);
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

      try {
        await synchronizePendingCheckIns(client, userId, systemClock.now());
        const [loadedItems, pendingOperations, loadedCompanionProgress, loadedDailyStreak] = await Promise.all([
          loadTodayRoutineItems(client, userId, nextRoutineDayWindow.key),
          loadPendingCheckInOperations(userId, nextRoutineDayWindow.key),
          loadCompanionProgress(client).catch(() => null),
          loadCurrentDailyStreak(
            client,
            userId,
            nextRoutineDayWindow.key,
            routineDayConfig,
          ).catch(() => null),
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
        if (loadedCompanionProgress) {
          companionProgressRef.current = loadedCompanionProgress;
          setCompanionProgress(loadedCompanionProgress);
        }
        dailyStreakRef.current = loadedDailyStreak;
        setDailyStreak(loadedDailyStreak);

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

  useEffect(() => {
    if (!completionFeedback) {
      return;
    }

    const timeout = setTimeout(() => {
      setCompletionFeedback((currentFeedback) =>
        currentFeedback?.id === completionFeedback.id ? null : currentFeedback,
      );
    }, COMPLETION_FEEDBACK_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [completionFeedback]);

  async function handleToggle(item: TodayRoutineItem) {
    const isComplete = item.completedAt !== null;
    const isCompletingRoutineDay =
      !isComplete &&
      items.length > 0 &&
      items.every((candidate) => candidate.id === item.id || candidate.completedAt !== null);
    const isUndoingCompletedRoutineDay =
      isComplete && items.length > 0 && items.every((candidate) => candidate.completedAt !== null);
    const occurredAt = systemClock.now().toISOString();
    const operation = createCheckInOutboxOperation({
      kind: isComplete ? 'undo' : 'complete',
      occurredAt,
      routineDay: routineDayWindow.key,
      routineItemId: item.id,
      userId,
    });

    setErrorCode(null);
    if (highlightedRoutineId === item.id) {
      setHighlightedRoutineId(null);
    }
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
      const feedbackId = completionFeedbackIdRef.current + 1;
      const previousCompanionProgress = companionProgressRef.current;
      const nextCompanionProgress = getCompanionProgressForExperience(
        previousCompanionProgress.experience + EXPERIENCE_PER_ROUTINE_COMPLETION,
      );

      completionFeedbackIdRef.current = feedbackId;
      setCompanionReactionId(feedbackId);
      companionProgressRef.current = nextCompanionProgress;
      setCompanionProgress(nextCompanionProgress);
      setCompletionFeedback({
        completedCount: items.filter((candidate) => candidate.completedAt !== null).length + 1,
        experienceGained: EXPERIENCE_PER_ROUTINE_COMPLETION,
        hasLevelUp: nextCompanionProgress.level > previousCompanionProgress.level,
        id: feedbackId,
        level: nextCompanionProgress.level,
        totalCount: items.length,
      });
      void playRoutineCompletionHaptic({
        isEnabled: isHapticsEnabled,
        shouldReduceMotion,
      });
    } else {
      const nextCompanionProgress = getCompanionProgressForExperience(
        companionProgressRef.current.experience - EXPERIENCE_PER_ROUTINE_COMPLETION,
      );

      companionProgressRef.current = nextCompanionProgress;
      setCompanionProgress(nextCompanionProgress);
    }
    if (isCompletingRoutineDay && dailyStreakRef.current !== null) {
      const nextDailyStreak = dailyStreakRef.current + 1;

      dailyStreakRef.current = nextDailyStreak;
      setDailyStreak(nextDailyStreak);
    }
    if (isUndoingCompletedRoutineDay && dailyStreakRef.current !== null) {
      const nextDailyStreak = Math.max(0, dailyStreakRef.current - 1);

      dailyStreakRef.current = nextDailyStreak;
      setDailyStreak(nextDailyStreak);
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
  const isAllComplete = items.length > 0 && completedCount === items.length;
  const microGoalItem = items.find((item) => item.completedAt === null) ?? null;

  function openMicroGoal() {
    if (!microGoalItem) {
      return;
    }

    setHighlightedRoutineId(microGoalItem.id);
    scrollViewRef.current?.scrollTo({
      animated: !shouldReduceMotion,
      y: Math.max(0, routineListOffsetRef.current - spacing.lg),
    });
  }

  return (
    <AppTabScreen
      activeTab="today"
      navigation={{
        onOpenPlans,
        onOpenProfile,
        onOpenStatistics,
        onOpenToday: () => undefined,
      }}
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
              {t('eyebrow', { name: displayName })}
            </Text>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: theme.colors.text }]}
            >
              {t('title')}
            </Text>
          </View>
        </View>

        <CompanionHero
          companionId={companionId}
          completedCount={completedCount}
          progress={companionProgress}
          reactionId={companionReactionId}
          routineDay={routineDayWindow.key}
          totalCount={items.length}
        />
        {completionFeedback ? (
          <CompletionFeedback
            completedCount={completionFeedback.completedCount}
            experienceGained={completionFeedback.experienceGained}
            feedbackId={completionFeedback.id}
            hasLevelUp={completionFeedback.hasLevelUp}
            level={completionFeedback.level}
            totalCount={completionFeedback.totalCount}
          />
        ) : null}
        <RoutineDayTiming config={routineDayConfig} />

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
          <>
            <TodayStatsSummary
              completedCount={completedCount}
              dailyStreak={dailyStreak}
              isDailyStreakLoading={isDailyStreakLoading}
              totalCount={items.length}
            />
            <StreakMomentCard
              dailyStreak={dailyStreak}
              isAllComplete={isAllComplete}
            />
            <MicroGoalCard item={microGoalItem} onOpenRoutine={openMicroGoal} />
            <View
              onLayout={(event) => {
                routineListOffsetRef.current = event.nativeEvent.layout.y;
              }}
              style={styles.list}
            >
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
                  borderColor:
                    isComplete || highlightedRoutineId === item.id
                      ? theme.colors.primary
                      : theme.colors.border,
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
          </>
        ) : null}
      </ScrollView>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.lg, paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { gap: spacing.md },
  headerCopy: { gap: spacing.xs },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 0.4, lineHeight: typography.lineHeight.caption },
  title: { flexShrink: 1, fontSize: typography.size.title, fontWeight: typography.weight.bold, letterSpacing: -0.4, lineHeight: typography.lineHeight.title },
  success: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  stateContainer: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center', minHeight: 180, padding: spacing.lg },
  stateText: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  primaryButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  primaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  retryButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  retryLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
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
