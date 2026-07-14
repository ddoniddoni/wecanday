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
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

const companionImage = require('../../../assets/companion/sprout-companion-hero.png');

type CompanionHeroProps = {
  completedCount: number;
  reactionId: number;
  routineDay: string;
  totalCount: number;
};

export function CompanionHero({
  completedCount,
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
      </View>
      <View
        pointerEvents="none"
        style={[styles.imageHalo, { backgroundColor: theme.colors.surface }]}
      />
      <Animated.Image
        accessibilityLabel={t('companion.imageLabel', { status: statusLabel })}
        accessibilityRole="image"
        resizeMode="contain"
        source={companionImage}
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
    minHeight: 206,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  copy: { flex: 1, gap: spacing.sm, paddingRight: spacing.xl, zIndex: 1 },
  routineDayLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 1, lineHeight: typography.lineHeight.caption },
  status: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title, marginTop: spacing.xs },
  progressTrack: { borderRadius: radii.pill, height: 10, marginTop: spacing.sm, overflow: 'hidden', width: '100%' },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  progressLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  imageHalo: { borderRadius: radii.pill, bottom: -72, height: 244, opacity: 0.2, position: 'absolute', right: -78, width: 244 },
  image: { bottom: -spacing.lg, height: 202, position: 'absolute', right: -spacing.md, width: 180 },
});
