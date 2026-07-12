import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPlanErrorCode, type PlanErrorCode } from '@/features/plans/domain/planErrors';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

const WEEKDAYS = [
  { key: 'sunday', value: 0 },
  { key: 'monday', value: 1 },
  { key: 'tuesday', value: 2 },
  { key: 'wednesday', value: 3 },
  { key: 'thursday', value: 4 },
  { key: 'friday', value: 5 },
  { key: 'saturday', value: 6 },
] as const;

const ALL_WEEKDAYS = WEEKDAYS.map(({ value }) => value);

type PlanCreateScreenProps = {
  onComplete: () => void;
  onSave: (input: {
    planTitle: string;
    routineTitle: string;
    scheduleWeekdays: number[];
  }) => Promise<void>;
};

export function PlanCreateScreen({ onComplete, onSave }: PlanCreateScreenProps) {
  const { t } = useTranslation('plans');
  const { theme } = useTheme();
  const [planTitle, setPlanTitle] = useState('');
  const [routineTitle, setRoutineTitle] = useState('');
  const [scheduleWeekdays, setScheduleWeekdays] = useState<number[]>(ALL_WEEKDAYS);
  const [errorCode, setErrorCode] = useState<PlanErrorCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function toggleWeekday(weekday: number) {
    setScheduleWeekdays((selectedWeekdays) =>
      selectedWeekdays.includes(weekday)
        ? selectedWeekdays.filter((value) => value !== weekday)
        : [...selectedWeekdays, weekday].toSorted((left, right) => left - right),
    );
  }

  async function handleSave() {
    if (
      planTitle.trim().length === 0 ||
      routineTitle.trim().length === 0 ||
      scheduleWeekdays.length === 0
    ) {
      setErrorCode('INVALID_PLAN_INPUT');
      return;
    }

    setErrorCode(null);
    setIsSaving(true);

    try {
      await onSave({
        planTitle: planTitle.trim(),
        routineTitle: routineTitle.trim(),
        scheduleWeekdays,
      });
      onComplete();
    } catch (error) {
      setErrorCode(getPlanErrorCode(error));
    } finally {
      setIsSaving(false);
    }
  }

  const errorMessage = errorCode ? t(`errors.${errorCode}`) : null;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
          {t('eyebrow')}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.colors.text }]}
        >
          {t('title')}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t('description')}
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('planTitleLabel')}
          </Text>
          <TextInput
            accessibilityLabel={t('planTitleLabel')}
            maxLength={80}
            onChangeText={setPlanTitle}
            placeholder={t('planTitlePlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={planTitle}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('routineTitleLabel')}
          </Text>
          <TextInput
            accessibilityLabel={t('routineTitleLabel')}
            maxLength={80}
            onChangeText={setRoutineTitle}
            placeholder={t('routineTitlePlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={routineTitle}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('scheduleLabel')}
          </Text>
          <View style={styles.weekdayList}>
            {WEEKDAYS.map((weekday) => {
              const isSelected = scheduleWeekdays.includes(weekday.value);

              return (
                <Pressable
                  accessibilityLabel={t(`weekdays.${weekday.key}`)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  key={weekday.key}
                  onPress={() => toggleWeekday(weekday.value)}
                  style={({ pressed }) => [
                    styles.weekdayButton,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.weekdayLabel,
                      { color: isSelected ? theme.colors.onPrimary : theme.colors.text },
                    ]}
                  >
                    {t(`weekdays.${weekday.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {errorMessage ? (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: theme.colors.text }]}
          >
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => void handleSave()}
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed || isSaving ? 0.7 : 1,
            },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator
              accessibilityLabel={t('saving')}
              color={theme.colors.onPrimary}
            />
          ) : (
            <Text style={[styles.saveButtonLabel, { color: theme.colors.onPrimary }]}>
              {t('create')}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  eyebrow: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.caption,
    marginTop: spacing.md,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.title,
  },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  fieldGroup: { gap: spacing.sm, marginTop: spacing.sm },
  label: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: typography.size.body,
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.md,
  },
  weekdayList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  weekdayButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: touchTarget.minimum,
    minWidth: touchTarget.minimum,
    paddingHorizontal: spacing.sm,
  },
  weekdayLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  saveButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.lg,
  },
  saveButtonLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
});
