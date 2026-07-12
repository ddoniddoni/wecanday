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
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.routineDayLabel, { color: theme.colors.textMuted }]}>
          {t('routineDayLabel')}
        </Text>
        <Text style={[styles.routineDayValue, { color: theme.colors.text }]}>
          {routineDay}
        </Text>
        <Text style={[styles.status, { color: theme.colors.primary }]}>{statusLabel}</Text>
        <View
          accessibilityLabel={t('progress', {
            completed: completedCount,
            total: totalCount,
          })}
          style={[styles.progressTrack, { backgroundColor: theme.colors.background }]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.accent, width: `${progressPercent}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressLabel, { color: theme.colors.textMuted }]}>
          {t('progress', { completed: completedCount, total: totalCount })}
        </Text>
      </View>
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
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 172,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  copy: { flex: 1, gap: spacing.xs, paddingVertical: spacing.sm },
  routineDayLabel: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  routineDayValue: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  status: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body, marginTop: spacing.xs },
  progressTrack: { borderRadius: radii.pill, height: 8, marginTop: spacing.sm, overflow: 'hidden', width: '100%' },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  progressLabel: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  image: { height: 150, marginRight: -spacing.md, width: 134 },
});
