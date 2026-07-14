import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

type CompletionFeedbackProps = {
  completedCount: number;
  experienceGained: number;
  feedbackId: number;
  hasLevelUp: boolean;
  level: number;
  totalCount: number;
};

export function CompletionFeedback({
  completedCount,
  experienceGained,
  feedbackId,
  hasLevelUp,
  level,
  totalCount,
}: CompletionFeedbackProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  useEffect(() => {
    if (shouldReduceMotion) {
      scale.set(1);
      return;
    }

    scale.set(
      withSequence(
        withTiming(1.03, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      ),
    );
  }, [feedbackId, scale, shouldReduceMotion]);

  return (
    <Animated.View
      accessibilityLabel={t('completionFeedback.accessibilityLabel', {
        completed: completedCount,
        total: totalCount,
      })}
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        animatedStyle,
        { backgroundColor: theme.colors.accent },
      ]}
      testID="completion-feedback"
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('completionFeedback.title')}
      </Text>
      <Text style={[styles.progress, { color: theme.colors.text }]}>
        {hasLevelUp
          ? t('completionFeedback.levelUp', { level })
          : t('completionFeedback.experience', { experience: experienceGained })}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radii.pill,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
  progress: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    lineHeight: typography.lineHeight.caption,
  },
});
