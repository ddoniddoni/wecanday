import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { getCompanionState } from '@/features/companion/domain/companion';
import type { CompanionProgress } from '@/features/companion/domain/progression';
import {
  getCompanionAsset,
  type CompanionId,
} from '@/features/companion/domain/companions';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

type CompanionHeroProps = {
  companionId: CompanionId;
  completedCount: number;
  progress: CompanionProgress;
  reactionId: number;
  routineDay: string;
  totalCount: number;
};

export function CompanionHero({
  companionId,
  completedCount,
  progress,
  reactionId,
  routineDay,
  totalCount,
}: CompanionHeroProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const companionState = getCompanionState({ completedCount, totalCount });
  const progressPercent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  const statusLabel = t(`companion.states.${companionState}`);
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  useEffect(() => {
    if (reactionId === 0 || shouldReduceMotion) {
      scale.set(1);
      return;
    }

    scale.set(
      withSequence(
        withTiming(1.08, { duration: 120 }),
        withTiming(0.96, { duration: 120 }),
        withTiming(1, { duration: 160 }),
      ),
    );
  }, [reactionId, scale, shouldReduceMotion]);

  return (
    <View
      accessibilityLabel={t('companion.accessibilityLabel', {
        experience: progress.experience,
        level: progress.level,
        routineDay,
        status: statusLabel,
      })}
      style={[
        styles.hero,
        { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.routineDayLabel, { color: theme.colors.onPrimary }]}>
          {t('companion.eyebrow')}
        </Text>
        <Text style={[styles.status, { color: theme.colors.onPrimary }]}>{statusLabel}</Text>
        <View
          accessibilityLabel={t('progress', {
            completed: completedCount,
            total: totalCount,
          })}
          style={[styles.progressTrack, { backgroundColor: theme.colors.surface }]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.accent, width: `${progressPercent}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressLabel, { color: theme.colors.onPrimary }]}>
          {t('progress', { completed: completedCount, total: totalCount })}
        </Text>
        <View
          accessibilityLabel={t('companion.growth.accessibilityLabel', {
            current: progress.experienceInLevel,
            level: progress.level,
            next: progress.experienceToNextLevel,
          })}
          style={styles.growth}
        >
          <View style={styles.growthHeader}>
            <Text
              style={[
                styles.levelBadge,
                { borderColor: theme.colors.surface, color: theme.colors.onPrimary },
              ]}
            >
              {t('companion.growth.level', { level: progress.level })}
            </Text>
            <Text style={[styles.growthLabel, { color: theme.colors.onPrimary }]}>
              {t('companion.growth.progress', {
                current: progress.experienceInLevel,
                next: progress.experienceToNextLevel,
              })}
            </Text>
          </View>
          <View style={[styles.growthTrack, { backgroundColor: theme.colors.surface }]}>
            <View
              style={[
                styles.growthFill,
                {
                  backgroundColor: theme.colors.accent,
                  width: `${(progress.experienceInLevel / progress.experienceToNextLevel) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
      <View
        pointerEvents="none"
        style={[styles.imageHalo, { backgroundColor: theme.colors.surface }]}
      />
      <Animated.Image
        accessibilityLabel={t('companion.imageLabel', { status: statusLabel })}
        accessibilityRole="image"
        resizeMode="contain"
        source={getCompanionAsset(companionId)}
        style={[styles.image, animatedImageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 236,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  copy: { gap: spacing.sm, maxWidth: '64%', zIndex: 1 },
  routineDayLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 1, lineHeight: typography.lineHeight.caption },
  status: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading, marginTop: spacing.xs },
  progressTrack: { borderRadius: radii.pill, height: 10, marginTop: spacing.sm, overflow: 'hidden', width: '100%' },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  progressLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  growth: { gap: spacing.xs, marginTop: spacing.xs },
  growthHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  levelBadge: { borderRadius: radii.pill, borderWidth: 1, fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption, overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: 2 },
  growthLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.caption },
  growthTrack: { borderRadius: radii.pill, height: 6, overflow: 'hidden', width: '100%' },
  growthFill: { borderRadius: radii.pill, height: '100%' },
  imageHalo: { borderRadius: radii.pill, bottom: -72, height: 244, opacity: 0.2, position: 'absolute', right: -78, width: 244 },
  image: { bottom: -spacing.lg, height: 202, position: 'absolute', right: -spacing.md, width: 180 },
});
