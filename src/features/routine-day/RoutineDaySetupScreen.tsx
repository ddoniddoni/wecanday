import { getCalendars } from 'expo-localization';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  adjustRoutineDayStartTime,
  formatRoutineDayStartTime,
  parseRoutineDayStartTime,
  validateRoutineDayConfig,
  type RoutineDayConfig,
} from '@/features/routine-day/domain/routineDay';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

const DAY_START_INCREMENT = 60;
const DEFAULT_DAY_START_MINUTE = 4 * 60;

type ValidationError = 'day_start' | 'time_zone';

type RoutineDaySetupScreenProps = {
  initialTimeZone?: string;
  onSave: (config: RoutineDayConfig) => Promise<void>;
};

function getRecommendedTimeZone(): string {
  return getCalendars()[0].timeZone ?? 'UTC';
}

export function RoutineDaySetupScreen({
  initialTimeZone = getRecommendedTimeZone(),
  onSave,
}: RoutineDaySetupScreenProps) {
  const { t } = useTranslation('routineDay');
  const { theme } = useTheme();
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const [dayStartTime, setDayStartTime] = useState(() =>
    formatRoutineDayStartTime(DEFAULT_DAY_START_MINUTE),
  );
  const [validationError, setValidationError] = useState<ValidationError | null>(
    null,
  );
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const dayStartMinute = parseRoutineDayStartTime(dayStartTime);

    if (dayStartMinute === null) {
      setHasSaveError(false);
      setValidationError('day_start');
      return;
    }

    const config = { dayStartMinute, timeZone: timeZone.trim() };

    try {
      validateRoutineDayConfig(config);
    } catch {
      setHasSaveError(false);
      setValidationError('time_zone');
      return;
    }

    setValidationError(null);
    setHasSaveError(false);
    setIsSaving(true);

    try {
      await onSave(config);
    } catch {
      setHasSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  const errorMessage =
    validationError === 'day_start'
      ? t('invalidDayStart')
      : validationError === 'time_zone'
        ? t('invalidTimeZone')
    : hasSaveError
      ? t('saveError')
      : null;

  function adjustDayStart(adjustment: number) {
    const currentMinute =
      parseRoutineDayStartTime(dayStartTime) ?? DEFAULT_DAY_START_MINUTE;

    setDayStartTime(
      formatRoutineDayStartTime(
        adjustRoutineDayStartTime(currentMinute, adjustment),
      ),
    );
    setValidationError(null);
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
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
            {t('timeZoneLabel')}
          </Text>
          <TextInput
            accessibilityLabel={t('timeZoneInputAccessibilityLabel')}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setTimeZone}
            placeholder={t('timeZonePlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.timeZoneInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={timeZone}
          />
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            {t('timeZoneHint')}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('dayStartLabel')}
          </Text>
          <View style={styles.dayStartControl}>
            <Pressable
              accessibilityLabel={t('decreaseDayStartAccessibilityLabel')}
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => adjustDayStart(-DAY_START_INCREMENT)}
              style={({ pressed }) => [
                styles.adjustButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  opacity: pressed || isSaving ? 0.65 : 1,
                },
              ]}
            >
              <Text style={[styles.adjustButtonLabel, { color: theme.colors.text }]}>
                −
              </Text>
            </Pressable>
            <TextInput
              accessibilityLabel={t('dayStartInputAccessibilityLabel')}
              autoCorrect={false}
              editable={!isSaving}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              onChangeText={setDayStartTime}
              placeholder={t('dayStartInputPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.dayStartInput,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={dayStartTime}
            />
            <Pressable
              accessibilityLabel={t('increaseDayStartAccessibilityLabel')}
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => adjustDayStart(DAY_START_INCREMENT)}
              style={({ pressed }) => [
                styles.adjustButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  opacity: pressed || isSaving ? 0.65 : 1,
                },
              ]}
            >
              <Text style={[styles.adjustButtonLabel, { color: theme.colors.text }]}>
                +
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            {t('dayStartHint')}
          </Text>
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
              {t('continue')}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  eyebrow: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.caption,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.title,
  },
  description: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  fieldGroup: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
  timeZoneInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: typography.size.body,
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.md,
  },
  hint: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
  dayStartControl: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  adjustButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: touchTarget.minimum,
    minWidth: touchTarget.minimum,
  },
  adjustButtonLabel: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.medium,
    lineHeight: typography.lineHeight.title,
  },
  dayStartInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: typography.size.body,
    fontVariant: ['tabular-nums'],
    fontWeight: typography.weight.bold,
    minHeight: touchTarget.minimum,
    minWidth: 104,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  error: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    textAlign: 'center',
  },
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
