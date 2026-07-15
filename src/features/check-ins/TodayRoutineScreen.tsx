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
  groupTodayRoutineItems,
  type TodayRoutineItem,
} from '@/features/check-ins/domain/todayRoutines';
import { AppTabScreen } from '@/components/AppTabScreen';
import { JourneyHeader } from '@/components/JourneyHeader';
import { CompletionFeedback } from '@/features/check-ins/CompletionFeedback';
import {
  EXPERIENCE_PER_ROUTINE_COMPLETION,
  getCompanionProgressForExperience,
} from '@/features/companion/domain/progression';
import type { CompanionId } from '@/features/companion/domain/companions';
import { TodayJourneyMap } from '@/features/check-ins/TodayJourneyMap';
import { JourneyLandscape, useJourneyScene } from '@/features/check-ins/JourneyLandscape';
import { TodayProgressSummary } from '@/features/check-ins/TodayProgressSummary';
import { RoutineExecutionScreen } from '@/features/check-ins/RoutineExecutionScreen';
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
const noOp = () => undefined;

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
  hasPlanCreationSuccess: boolean;
  isHapticsEnabled: boolean;
  isMotionReduced: boolean;
  onCreatePlan: () => void;
  onOpenCommunity?: () => void;
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
  hasPlanCreationSuccess,
  isHapticsEnabled,
  isMotionReduced,
  onCreatePlan,
  onOpenCommunity = noOp,
  onOpenPlans,
  onOpenProfile,
  onOpenStatistics,
  onRoutineCompletionChanged,
  routineDayConfig,
  userId,
}: TodayRoutineScreenProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion() || isMotionReduced;
  const journeyScene = useJourneyScene(routineDayConfig.timeZone);
  const [routineDayWindow, setRoutineDayWindow] = useState<RoutineDayWindow>(() =>
    getCurrentRoutineDayWindow(routineDayConfig),
  );
  const [items, setItems] = useState<TodayRoutineItem[]>([]);
  const selectedRoutineDay = routineDayWindow.key;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutatingRoutineIds, setMutatingRoutineIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [errorCode, setErrorCode] = useState<CheckInErrorCode | null>(null);
  const initialCompanionProgress = getCompanionProgressForExperience(0);
  const companionProgressRef = useRef(initialCompanionProgress);
  const [companionProgress, setCompanionProgress] = useState(initialCompanionProgress);
  const [completionFeedback, setCompletionFeedback] =
    useState<CompletionFeedbackState | null>(null);
  const completionFeedbackIdRef = useRef(0);
  const [dailyStreak, setDailyStreak] = useState<number | null>(null);
  const dailyStreakRef = useRef<number | null>(null);
  const [isDailyStreakLoading, setIsDailyStreakLoading] = useState(true);
  const [executionRoutineId, setExecutionRoutineId] = useState<string | null>(null);
  const latestRefreshIdRef = useRef(0);

  const refresh = useCallback(
    async (showLoading: boolean) => {
      const refreshId = latestRefreshIdRef.current + 1;
      latestRefreshIdRef.current = refreshId;
      const nextRoutineDayWindow = getCurrentRoutineDayWindow(routineDayConfig);
      const isCurrentRoutineDay = selectedRoutineDay === nextRoutineDayWindow.key;

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
          loadTodayRoutineItems(client, userId, selectedRoutineDay),
          isCurrentRoutineDay
            ? loadPendingCheckInOperations(userId, selectedRoutineDay)
            : Promise.resolve([]),
          loadCompanionProgress(client).catch(() => null),
          loadCurrentDailyStreak(
            client,
            userId,
            nextRoutineDayWindow.key,
            routineDayConfig,
          ).catch(() => null),
        ]);

        if (latestRefreshIdRef.current !== refreshId) {
          return;
        }

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
        if (latestRefreshIdRef.current === refreshId) {
          setErrorCode(getCheckInErrorCode(error));
        }
      } finally {
        if (latestRefreshIdRef.current === refreshId) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsDailyStreakLoading(false);
        }
      }
    },
    [client, routineDayConfig, selectedRoutineDay, userId],
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
    if (selectedRoutineDay !== routineDayWindow.key) {
      return;
    }

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
      routineDay: selectedRoutineDay,
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
      const feedbackId = completionFeedbackIdRef.current + 1;
      const previousCompanionProgress = companionProgressRef.current;
      const nextCompanionProgress = getCompanionProgressForExperience(
        previousCompanionProgress.experience + EXPERIENCE_PER_ROUTINE_COMPLETION,
      );

      completionFeedbackIdRef.current = feedbackId;
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

      await removeCheckInOperationsForRoutine(userId, item.id, selectedRoutineDay);
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
  const isCurrentRoutineDay = selectedRoutineDay === routineDayWindow.key;
  const nextRoutineId = isCurrentRoutineDay
    ? groupTodayRoutineItems(items)
      .flatMap((group) => group.items)
      .find((item) => item.completedAt === null)?.id ?? null
    : null;
  if (executionRoutineId && isCurrentRoutineDay) {
    return (
      <RoutineExecutionScreen
        initialRoutineId={executionRoutineId}
        items={items}
        mutatingRoutineIds={mutatingRoutineIds}
        onBack={() => setExecutionRoutineId(null)}
        onCompleteRoutine={handleToggle}
      />
    );
  }

  return (
    <AppTabScreen
      activeTab="today"
      navigation={{
        onOpenCommunity,
        onOpenPlans,
        onOpenProfile,
        onOpenStatistics,
        onOpenToday: () => undefined,
      }}
    >
      <View style={styles.homeContent}>
        <JourneyLandscape scene={journeyScene} />
        <ScrollView contentContainerStyle={styles.content}>
        <JourneyHeader
          companionId={companionId}
          experience={companionProgress.experience}
          level={companionProgress.level}
        />
        {!isLoading && !errorCode && isCurrentRoutineDay ? (
          <TodayProgressSummary
            completedCount={completedCount}
            dailyStreak={dailyStreak}
            isDailyStreakLoading={isDailyStreakLoading}
            routineDayConfig={routineDayConfig}
            totalCount={items.length}
          />
        ) : null}
        {completionFeedback ? (
          <CompletionFeedback
            completedCount={completionFeedback.completedCount}
            experienceGained={completionFeedback.experienceGained}
            feedbackId={completionFeedback.id}
            hasLevelUp={completionFeedback.hasLevelUp}
            level={completionFeedback.level}
            reduceMotion={shouldReduceMotion}
            totalCount={completionFeedback.totalCount}
          />
        ) : null}

        {hasPlanCreationSuccess ? (
          <Text style={[styles.success, { color: theme.colors.text }]}>
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
              {isCurrentRoutineDay ? t('emptyTitle') : t('emptyHistoryTitle')}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              {isCurrentRoutineDay ? t('emptyDescription') : t('emptyHistoryDescription')}
            </Text>
            {isCurrentRoutineDay ? (
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
            ) : null}
          </View>
        ) : null}

        {!isLoading && !errorCode && items.length > 0 ? (
          <TodayJourneyMap
            companionId={companionId}
            isLandscapeBackgroundShared
            isReadOnly={!isCurrentRoutineDay}
            items={items}
            mutatingRoutineIds={mutatingRoutineIds}
            nextRoutineId={nextRoutineId}
            onStartRoutine={(item) => setExecutionRoutineId(item.id)}
            onToggleRoutine={(item) => void handleToggle(item)}
            scene={journeyScene}
          />
        ) : null}
        </ScrollView>
      </View>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.lg, paddingBottom: spacing.xxl, paddingHorizontal: spacing.md },
  homeContent: { flex: 1, overflow: 'hidden' },
  success: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  stateContainer: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center', minHeight: 180, padding: spacing.lg },
  stateText: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  primaryButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  primaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  retryButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  retryLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
});
