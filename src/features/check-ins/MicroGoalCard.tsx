import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TodayRoutineItem } from '@/features/check-ins/domain/todayRoutines';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type MicroGoalCardProps = {
  item: Pick<TodayRoutineItem, 'title'> | null;
  onOpenRoutine: () => void;
};

export function MicroGoalCard({ item, onOpenRoutine }: MicroGoalCardProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const isComplete = item === null;

  return (
    <View
      accessibilityLabel={
        isComplete
          ? t('microGoal.complete.accessibilityLabel')
          : t('microGoal.action.accessibilityLabel', { title: item.title })
      }
      style={[
        styles.card,
        {
          backgroundColor: isComplete ? theme.colors.surface : theme.colors.background,
          borderColor: isComplete ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
        {t('microGoal.eyebrow')}
      </Text>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
        {isComplete ? t('microGoal.complete.title') : item.title}
      </Text>
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>
        {isComplete
          ? t('microGoal.complete.description')
          : t('microGoal.action.description')}
      </Text>
      {!isComplete ? (
        <Pressable
          accessibilityLabel={t('microGoal.action.button', { title: item.title })}
          accessibilityRole="button"
          onPress={onOpenRoutine}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonLabel, { color: theme.colors.onPrimary }]}>
            {t('microGoal.action.buttonLabel')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  eyebrow: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.8,
    lineHeight: typography.lineHeight.caption,
  },
  title: {
    fontSize: typography.size.heading,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.heading,
  },
  description: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    justifyContent: 'center',
    marginTop: spacing.xs,
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.lg,
  },
  buttonLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
});
