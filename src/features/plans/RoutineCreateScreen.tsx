import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getRoutineCreationErrorCode,
  type RoutineCreationErrorCode,
} from '@/features/plans/domain/planErrors';
import {
  formatReminderTime,
  getRoutineFormIssues,
  parseReminderMinute,
  type RoutineFormIssue,
} from '@/features/plans/domain/routineFormValidation';
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

type RoutineCreateScreenProps = {
  initialRoutineTitle?: string;
  initialReminderMinute?: number | null;
  initialScheduleWeekdays?: number[];
  mode?: 'create' | 'edit';
  onArchive?: () => Promise<void>;
  onBack: () => void;
  onChangeStatus?: (status: 'active' | 'paused') => Promise<void>;
  onComplete: () => void;
  onSave: (input: { reminderMinute: number | null; routineTitle: string; scheduleWeekdays: number[] }) => Promise<void>;
  planTitle: string;
  returnTo?: 'plans' | 'today';
  routineStatus?: 'active' | 'paused';
};

export function RoutineCreateScreen({
  onBack,
  onComplete,
  onSave,
  planTitle,
  initialRoutineTitle = '',
  initialReminderMinute = null,
  initialScheduleWeekdays = ALL_WEEKDAYS,
  mode = 'create',
  onArchive,
  onChangeStatus,
  returnTo = 'today',
  routineStatus = 'active',
}: RoutineCreateScreenProps) {
  const { t } = useTranslation('plans');
  const { theme } = useTheme();
  const [routineTitle, setRoutineTitle] = useState(initialRoutineTitle);
  const [reminderTime, setReminderTime] = useState(() => formatReminderTime(initialReminderMinute));
  const [scheduleWeekdays, setScheduleWeekdays] = useState<number[]>(initialScheduleWeekdays);
  const copyKey = mode === 'edit' ? 'routineEdit' : 'routineCreate';
  const [errorCode, setErrorCode] = useState<RoutineCreationErrorCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isArchiveConfirmationVisible, setIsArchiveConfirmationVisible] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const routineTitleInputRef = useRef<TextInput>(null);
  const reminderTimeInputRef = useRef<TextInput>(null);
  const backKey = mode === 'edit'
    ? returnTo === 'plans'
      ? 'routineEdit.backToPlans'
      : 'routineEdit.back'
    : 'routineCreate.back';
  const nextRoutineStatus = routineStatus === 'active' ? 'paused' : 'active';
  const statusActionKey = nextRoutineStatus === 'paused' ? 'pause' : 'resume';
  const validationIssues = getRoutineFormIssues({
    reminderTime,
    routineTitle,
    scheduleWeekdays,
  });
  const shouldShowValidation = hasAttemptedSave && validationIssues.length > 0;
  const hasRoutineTitleIssue = shouldShowValidation && validationIssues.includes('routineTitle');
  const hasReminderTimeIssue = shouldShowValidation && validationIssues.includes('reminderTime');
  const hasScheduleWeekdaysIssue = shouldShowValidation && validationIssues.includes('scheduleWeekdays');

  function toggleWeekday(weekday: number) {
    setErrorCode(null);
    setScheduleWeekdays((selectedWeekdays) =>
      selectedWeekdays.includes(weekday)
        ? selectedWeekdays.filter((value) => value !== weekday)
        : [...selectedWeekdays, weekday].sort((left, right) => left - right),
    );
  }

  async function handleSave() {
    const reminderMinute = parseReminderMinute(reminderTime);
    setHasAttemptedSave(true);
    if (validationIssues.length > 0 || reminderMinute === undefined) {
      setErrorCode(null);
      focusFirstInvalidField(validationIssues);
      return;
    }

    setErrorCode(null);
    setIsSaving(true);

    try {
      await onSave({
        reminderMinute,
        routineTitle: routineTitle.trim(),
        scheduleWeekdays,
      });
      onComplete();
    } catch (error) {
      setErrorCode(getRoutineCreationErrorCode(error));
    } finally {
      setIsSaving(false);
    }
  }

  function focusFirstInvalidField(issues: RoutineFormIssue[]) {
    if (issues.includes('routineTitle')) {
      routineTitleInputRef.current?.focus();
      return;
    }

    if (issues.includes('reminderTime')) {
      reminderTimeInputRef.current?.focus();
    }
  }

  async function handleStatusChange() {
    if (!onChangeStatus) {
      return;
    }

    setErrorCode(null);
    setIsChangingStatus(true);

    try {
      await onChangeStatus(nextRoutineStatus);
      onComplete();
    } catch (error) {
      setErrorCode(getRoutineCreationErrorCode(error));
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleArchive() {
    if (!onArchive) {
      return;
    }

    setErrorCode(null);
    setIsArchiving(true);

    try {
      await onArchive();
      onComplete();
    } catch (error) {
      setErrorCode(getRoutineCreationErrorCode(error));
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityLabel={t(backKey)}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Text style={[styles.backButtonLabel, { color: theme.colors.text }]}>
            {t(backKey)}
          </Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
          {t(`${copyKey}.planLabel`, { planTitle })}
        </Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t(`${copyKey}.title`)}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t(`${copyKey}.description`)}
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('routineTitleLabel')}
          </Text>
          <TextInput
            accessibilityLabel={t('routineTitleLabel')}
            accessibilityHint={hasRoutineTitleIssue ? t('validation.routineTitle') : undefined}
            maxLength={80}
            onChangeText={(nextRoutineTitle) => {
              setRoutineTitle(nextRoutineTitle);
              setErrorCode(null);
            }}
            placeholder={t('routineTitlePlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            ref={routineTitleInputRef}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: hasRoutineTitleIssue ? theme.colors.accent : theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={routineTitle}
          />
          {hasRoutineTitleIssue ? (
            <Text accessibilityLiveRegion="polite" style={[styles.fieldError, { color: theme.colors.accent }]}>
              {t('validation.routineTitle')}
            </Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('reminderTimeLabel')}</Text>
          <TextInput
            accessibilityLabel={t('reminderTimeLabel')}
            accessibilityHint={hasReminderTimeIssue ? t('validation.reminderTime') : undefined}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            onChangeText={(nextReminderTime) => {
              setReminderTime(nextReminderTime);
              setErrorCode(null);
            }}
            placeholder={t('reminderTimePlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            ref={reminderTimeInputRef}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: hasReminderTimeIssue ? theme.colors.accent : theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={reminderTime}
          />
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('reminderTimeHint')}</Text>
          {hasReminderTimeIssue ? (
            <Text accessibilityLiveRegion="polite" style={[styles.fieldError, { color: theme.colors.accent }]}>
              {t('validation.reminderTime')}
            </Text>
          ) : null}
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
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.weekdayLabel, { color: isSelected ? theme.colors.onPrimary : theme.colors.text }]}>
                    {t(`weekdays.${weekday.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {hasScheduleWeekdaysIssue ? (
            <Text accessibilityLiveRegion="polite" style={[styles.fieldError, { color: theme.colors.accent }]}>
              {t('validation.scheduleWeekdays')}
            </Text>
          ) : null}
        </View>

        {shouldShowValidation ? (
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[styles.validationSummary, { backgroundColor: theme.colors.surface, borderColor: theme.colors.accent }]}
          >
            <Text style={[styles.validationTitle, { color: theme.colors.text }]}>
              {t('validation.summaryTitle')}
            </Text>
            {validationIssues.map((issue) => (
              <Text key={issue} style={[styles.validationItem, { color: theme.colors.textMuted }]}>
                {t(`validation.${issue}`)}
              </Text>
            ))}
          </View>
        ) : null}

        {errorCode ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
            {t(`errors.${errorCode}`)}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => void handleSave()}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.colors.primary, opacity: pressed || isSaving ? 0.7 : 1 },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator accessibilityLabel={t(`${copyKey}.saving`)} color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.saveButtonLabel, { color: theme.colors.onPrimary }]}>
              {t(`${copyKey}.create`)}
            </Text>
          )}
        </Pressable>

        {mode === 'edit' && onChangeStatus ? (
          <Pressable
            accessibilityRole="button"
            disabled={isChangingStatus || isSaving}
            onPress={() => void handleStatusChange()}
            style={({ pressed }) => [
              styles.statusButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed || isChangingStatus || isSaving ? 0.7 : 1,
              },
            ]}
          >
            {isChangingStatus ? (
              <ActivityIndicator
                accessibilityLabel={t(`routineEdit.${statusActionKey === 'pause' ? 'pausing' : 'resuming'}`)}
                color={theme.colors.text}
              />
            ) : (
              <Text style={[styles.statusButtonLabel, { color: theme.colors.text }]}>
                {t(`routineEdit.${statusActionKey}`)}
              </Text>
            )}
          </Pressable>
        ) : null}

        {mode === 'edit' && onArchive ? (
          <View style={styles.archiveSection}>
            {isArchiveConfirmationVisible ? (
              <View
                accessibilityRole="alert"
                style={[
                  styles.archiveConfirmation,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.archiveConfirmationTitle, { color: theme.colors.text }]}>
                  {t('routineEdit.archiveConfirmationTitle')}
                </Text>
                <Text style={[styles.archiveConfirmationDescription, { color: theme.colors.textMuted }]}>
                  {t('routineEdit.archiveConfirmationDescription')}
                </Text>
                <View style={styles.archiveActions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isArchiving}
                    onPress={() => setIsArchiveConfirmationVisible(false)}
                    style={({ pressed }) => [
                      styles.archiveSecondaryButton,
                      {
                        borderColor: theme.colors.border,
                        opacity: pressed || isArchiving ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.archiveSecondaryLabel, { color: theme.colors.text }]}>
                      {t('routineEdit.archiveCancel')}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isArchiving}
                    onPress={() => void handleArchive()}
                    style={({ pressed }) => [
                      styles.archiveConfirmButton,
                      {
                        backgroundColor: theme.colors.primary,
                        opacity: pressed || isArchiving ? 0.7 : 1,
                      },
                    ]}
                  >
                    {isArchiving ? (
                      <ActivityIndicator
                        accessibilityLabel={t('routineEdit.archiving')}
                        color={theme.colors.onPrimary}
                      />
                    ) : (
                      <Text style={[styles.archiveConfirmLabel, { color: theme.colors.onPrimary }]}>
                        {t('routineEdit.archiveConfirm')}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={isSaving || isChangingStatus}
                onPress={() => setIsArchiveConfirmationVisible(true)}
                style={({ pressed }) => [
                  styles.archiveButton,
                  {
                    borderColor: theme.colors.border,
                    opacity: pressed || isSaving || isChangingStatus ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.archiveButtonLabel, { color: theme.colors.text }]}>
                  {t('routineEdit.archive')}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backButtonLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption, marginTop: spacing.sm },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  fieldGroup: { gap: spacing.sm, marginTop: spacing.sm },
  fieldError: { fontSize: typography.size.caption, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.caption },
  label: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  input: { borderRadius: radii.md, borderWidth: 1, fontSize: typography.size.body, minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  weekdayList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  weekdayButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, minWidth: touchTarget.minimum, paddingHorizontal: spacing.sm },
  weekdayLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  validationSummary: { borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  validationTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  validationItem: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  saveButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', marginTop: spacing.md, minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  saveButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  statusButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  statusButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  archiveSection: { marginTop: spacing.md },
  archiveButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  archiveButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  archiveConfirmation: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  archiveConfirmationTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  archiveConfirmationDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  archiveActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  archiveSecondaryButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  archiveSecondaryLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  archiveConfirmButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  archiveConfirmLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
});
