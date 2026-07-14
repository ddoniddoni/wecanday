import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { TodayRoutineItem } from '@/features/check-ins/domain/todayRoutines';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

const FOCUS_SESSION_SECONDS = 15 * 60;

type RoutineExecutionScreenProps = {
  initialRoutineId: string;
  items: TodayRoutineItem[];
  mutatingRoutineIds: ReadonlySet<string>;
  onBack: () => void;
  onCompleteRoutine: (item: TodayRoutineItem) => Promise<void>;
};

export function RoutineExecutionScreen({
  initialRoutineId,
  items,
  mutatingRoutineIds,
  onBack,
  onCompleteRoutine,
}: RoutineExecutionScreenProps) {
  const { t } = useTranslation('routineExecution');
  const { theme } = useTheme();
  const [activeRoutineId, setActiveRoutineId] = useState(initialRoutineId);
  const [isCompleting, setIsCompleting] = useState(false);
  const incompleteItems = items.filter((item) => item.completedAt === null);
  const activeRoutine = incompleteItems.find((item) => item.id === activeRoutineId)
    ?? incompleteItems[0]
    ?? null;
  const currentIndex = activeRoutine
    ? incompleteItems.findIndex((item) => item.id === activeRoutine.id)
    : -1;
  const nextRoutine = currentIndex >= 0 ? incompleteItems[currentIndex + 1] ?? null : null;
  const completedCount = items.length - incompleteItems.length;

  async function handleComplete() {
    if (!activeRoutine || isCompleting || mutatingRoutineIds.has(activeRoutine.id)) {
      return;
    }

    setIsCompleting(true);
    try {
      await onCompleteRoutine(activeRoutine);
      if (nextRoutine) {
        setActiveRoutineId(nextRoutine.id);
      }
    } finally {
      setIsCompleting(false);
    }
  }

  if (!activeRoutine) {
    return (
      <ExecutionLayout onBack={onBack}>
        <View
          accessibilityRole="summary"
          style={[styles.completedState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <Text accessibilityRole="header" style={[styles.completedTitle, { color: theme.colors.text }]}>
            {t('allComplete.title')}
          </Text>
          <Text style={[styles.completedDescription, { color: theme.colors.textMuted }]}>
            {t('allComplete.description')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('allComplete.backLabel')}
            onPress={onBack}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.colors.primary, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.primaryButtonLabel, { color: theme.colors.onPrimary }]}>
              {t('allComplete.back')}
            </Text>
          </Pressable>
        </View>
      </ExecutionLayout>
    );
  }

  return (
    <ExecutionLayout onBack={onBack}>
      <View style={styles.progressCopy}>
        <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
          {t('progress', { current: completedCount + 1, total: items.length })}
        </Text>
        <View
          accessibilityLabel={t('progressAccessibilityLabel', {
            completed: completedCount,
            total: items.length,
          })}
          accessibilityRole="progressbar"
          accessibilityValue={{ max: items.length, min: 0, now: completedCount }}
          style={[styles.progressTrack, { backgroundColor: theme.colors.background }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${items.length === 0 ? 0 : (completedCount / items.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={[styles.focusCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.currentLabel, { color: theme.colors.primary }]}>
          {t('currentLabel')}
        </Text>
        <Text accessibilityRole="header" numberOfLines={3} style={[styles.routineTitle, { color: theme.colors.text }]}>
          {activeRoutine.title}
        </Text>
        <FocusSessionTimer key={activeRoutine.id} />
      </View>

      <View style={[styles.nextCard, { borderColor: theme.colors.border }]}>
        <Text style={[styles.nextLabel, { color: theme.colors.textMuted }]}>{t('nextLabel')}</Text>
        <Text numberOfLines={2} style={[styles.nextTitle, { color: theme.colors.text }]}>
          {nextRoutine ? nextRoutine.title : t('nextEmpty')}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('skipAccessibilityLabel', { title: activeRoutine.title })}
          accessibilityState={{ disabled: nextRoutine === null }}
          disabled={nextRoutine === null}
          onPress={() => nextRoutine && setActiveRoutineId(nextRoutine.id)}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              borderColor: theme.colors.border,
              opacity: pressed || nextRoutine === null ? 0.52 : 1,
            },
          ]}
        >
          <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>{t('skip')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('completeAccessibilityLabel', { title: activeRoutine.title })}
          accessibilityState={{ busy: isCompleting || mutatingRoutineIds.has(activeRoutine.id) }}
          disabled={isCompleting || mutatingRoutineIds.has(activeRoutine.id)}
          onPress={() => void handleComplete()}
          style={({ pressed }) => [
            styles.completeButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed || isCompleting || mutatingRoutineIds.has(activeRoutine.id) ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.completeButtonLabel, { color: theme.colors.onPrimary }]}>
            {t('complete')}
          </Text>
        </Pressable>
      </View>
    </ExecutionLayout>
  );
}

function ExecutionLayout({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  const { t } = useTranslation('routineExecution');
  const { theme } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.64 : 1 },
          ]}
        >
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>{t('back')}</Text>
        </Pressable>
        {children}
      </View>
    </SafeAreaView>
  );
}

function FocusSessionTimer() {
  const { t } = useTranslation('routineExecution');
  const { theme } = useTheme();
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_SESSION_SECONDS);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || remainingSeconds === 0) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((currentSeconds) => Math.max(0, currentSeconds - 1));
    }, 1_000);

    return () => clearInterval(interval);
  }, [isPaused, remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
  const formattedTime = `${minutes}:${seconds}`;

  return (
    <View style={styles.timerSection}>
      <Text style={[styles.timerLabel, { color: theme.colors.textMuted }]}>{t('timerLabel')}</Text>
      <Text accessibilityLabel={t('timerAccessibilityLabel', { time: formattedTime })} style={[styles.timerValue, { color: theme.colors.text }]}>
        {formattedTime}
      </Text>
      <Text style={[styles.timerDescription, { color: theme.colors.textMuted }]}>{t('timerDescription')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPaused ? t('resume') : t('pause')}
        onPress={() => setIsPaused((currentPaused) => !currentPaused)}
        style={({ pressed }) => [
          styles.pauseButton,
          { borderColor: theme.colors.border, opacity: pressed ? 0.64 : 1 },
        ]}
      >
        <Text style={[styles.pauseButtonLabel, { color: theme.colors.text }]}>
          {isPaused ? t('resume') : t('pause')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: 'auto' },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  completeButton: { alignItems: 'center', borderRadius: radii.md, flex: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  completeButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  completedDescription: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  completedState: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, marginTop: 'auto', padding: spacing.xl },
  completedTitle: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading, textAlign: 'center' },
  content: { flex: 1, gap: spacing.lg, padding: spacing.lg },
  currentLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  focusCard: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  nextCard: { borderBottomWidth: 1, gap: spacing.xs, paddingBottom: spacing.md },
  nextLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  nextTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  pauseButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  pauseButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  primaryButton: { alignItems: 'center', borderRadius: radii.md, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  primaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  progressCopy: { gap: spacing.sm },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  progressTrack: { borderRadius: radii.pill, height: spacing.sm, overflow: 'hidden', width: '100%' },
  routineTitle: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title, textAlign: 'center' },
  screen: { flex: 1 },
  secondaryButton: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  secondaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  timerDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  timerLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.caption },
  timerSection: { alignItems: 'center', gap: spacing.sm },
  timerValue: { fontSize: typography.size.display, fontVariant: ['tabular-nums'], fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.display },
});
