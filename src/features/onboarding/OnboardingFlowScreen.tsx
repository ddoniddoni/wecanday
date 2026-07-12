import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  filterCountryOptions,
  getCountryOptions,
  type CountryOption,
} from '@/features/onboarding/domain/countries';
import type { OnboardingPreferences } from '@/features/onboarding/domain/preferences';
import { saveOnboardingPreferences } from '@/features/onboarding/data/onboardingPreferencesStorage';
import { localeOptions, resolveSupportedLocale } from '@/i18n/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type OnboardingStep = 'country' | 'language' | 'greeting';

type OnboardingFlowScreenProps = {
  initialPreferences: OnboardingPreferences;
  onComplete: (preferences: OnboardingPreferences) => void;
  persistPreferences?: (preferences: OnboardingPreferences) => Promise<void>;
};

type CountryOptionRowProps = {
  isSelected: boolean;
  onSelect: (countryCode: string) => void;
  option: CountryOption;
};

function CountryOptionRow({
  isSelected,
  onSelect,
  option,
}: CountryOptionRowProps) {
  const { t } = useTranslation('onboarding');
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={t('countryOptionLabel', {
        code: option.code,
        country: option.name,
      })}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelect(option.code)}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isSelected
            ? theme.colors.primary
            : theme.colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.optionTextGroup}>
        <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
          {option.name}
        </Text>
        <Text style={[styles.optionCode, { color: theme.colors.textMuted }]}>
          {option.code}
        </Text>
      </View>
      <Text style={[styles.selectedLabel, { color: theme.colors.primary }]}>
        {isSelected ? t('selected') : ''}
      </Text>
    </Pressable>
  );
}

type ActionButtonProps = {
  isDisabled?: boolean;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

function ActionButton({
  isDisabled = false,
  label,
  onPress,
  variant = 'primary',
}: ActionButtonProps) {
  const { theme } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: isPrimary
            ? theme.colors.primary
            : theme.colors.surface,
          borderColor: isPrimary
            ? theme.colors.primary
            : theme.colors.border,
          opacity: isDisabled ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.actionButtonLabel,
          {
            color: isPrimary
              ? theme.colors.onPrimary
              : theme.colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getInitialStep(
  preferences: OnboardingPreferences,
): OnboardingStep {
  if (!preferences.countryCode) {
    return 'country';
  }

  return preferences.locale ? 'greeting' : 'language';
}

export function OnboardingFlowScreen({
  initialPreferences,
  onComplete,
  persistPreferences = saveOnboardingPreferences,
}: OnboardingFlowScreenProps) {
  const { i18n, t } = useTranslation('onboarding');
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [step, setStep] = useState<OnboardingStep>(() =>
    getInitialStep(initialPreferences),
  );
  const [countryQuery, setCountryQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaveError, setHasSaveError] = useState(false);
  const displayLocale = resolveSupportedLocale(i18n.resolvedLanguage);
  const countryOptions = getCountryOptions(displayLocale);
  const filteredCountryOptions = filterCountryOptions(
    countryOptions,
    countryQuery,
    displayLocale,
  );

  async function persistAndApply(
    nextPreferences: OnboardingPreferences,
    afterSave: () => Promise<void> | void,
  ) {
    setIsSaving(true);
    setHasSaveError(false);

    try {
      await persistPreferences(nextPreferences);
      setPreferences(nextPreferences);
      await afterSave();
      setIsSaving(false);
    } catch {
      setHasSaveError(true);
      setIsSaving(false);
    }
  }

  function handleCountryContinue() {
    if (!preferences.countryCode) {
      return;
    }

    void persistAndApply(preferences, () => setStep('language'));
  }

  function handleLanguageSelect(locale: OnboardingPreferences['locale']) {
    if (!locale) {
      return;
    }

    const nextPreferences = { ...preferences, locale };

    void persistAndApply(nextPreferences, async () => {
      await i18n.changeLanguage(locale);
      setStep('greeting');
    });
  }

  function handleComplete() {
    const nextPreferences = { ...preferences, isComplete: true };

    void persistAndApply(nextPreferences, () => onComplete(nextPreferences));
  }

  function handleCountrySelect(countryCode: string) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      countryCode,
    }));
    setHasSaveError(false);
  }

  function renderCountryOption({ item }: ListRenderItemInfo<CountryOption>) {
    return (
      <CountryOptionRow
        isSelected={preferences.countryCode === item.code}
        onSelect={handleCountrySelect}
        option={item}
      />
    );
  }

  const errorMessage = hasSaveError ? (
    <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
      {t('saveError')}
    </Text>
  ) : null;

  if (step === 'country') {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.contentHeader}>
          <Text style={[styles.progress, { color: theme.colors.primary }]}>
            {t('stepProgress', { current: 1, total: 3 })}
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.colors.text }]}
          >
            {t('countryTitle')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {t('countryDescription')}
          </Text>
          <TextInput
            accessibilityLabel={t('countrySearchLabel')}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setCountryQuery}
            placeholder={t('countrySearchPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="search"
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={countryQuery}
          />
        </View>
        <FlatList
          contentContainerStyle={styles.countryList}
          data={filteredCountryOptions}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.code}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.colors.textMuted }]}>
              {t('countryEmpty')}
            </Text>
          }
          renderItem={renderCountryOption}
        />
        <View style={styles.footer}>
          {errorMessage}
          <ActionButton
            isDisabled={!preferences.countryCode || isSaving}
            label={t('continue')}
            onPress={handleCountryContinue}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'language') {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centeredContent}>
          <Text style={[styles.progress, { color: theme.colors.primary }]}>
            {t('stepProgress', { current: 2, total: 3 })}
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.colors.text }]}
          >
            {t('languageTitle')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {t('languageDescription')}
          </Text>
          <View style={styles.languageOptions}>
            {localeOptions.map((option) => (
              <Pressable
                accessibilityLabel={t('languageOptionLabel', {
                  language: option.nativeName,
                })}
                accessibilityRole="button"
                disabled={isSaving}
                key={option.code}
                onPress={() => handleLanguageSelect(option.code)}
                style={({ pressed }) => [
                  styles.languageOption,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: isSaving ? 0.45 : pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text style={[styles.languageName, { color: theme.colors.text }]}>
                  {option.nativeName}
                </Text>
              </Pressable>
            ))}
          </View>
          {errorMessage}
        </View>
        <View style={styles.footer}>
          <ActionButton
            isDisabled={isSaving}
            label={t('back')}
            onPress={() => setStep('country')}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.greetingContent}>
        <Text style={[styles.progress, { color: theme.colors.primary }]}>
          {t('stepProgress', { current: 3, total: 3 })}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.greeting, { color: theme.colors.text }]}
        >
          {t('greeting')}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t('greetingDescription')}
        </Text>
        {errorMessage}
      </View>
      <View style={styles.footer}>
        <ActionButton
          isDisabled={isSaving}
          label={t('back')}
          onPress={() => setStep('language')}
          variant="secondary"
        />
        <ActionButton
          isDisabled={isSaving}
          label={t('start')}
          onPress={handleComplete}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentHeader: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  centeredContent: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  greetingContent: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  progress: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.caption,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.title,
  },
  greeting: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.title,
  },
  description: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  searchInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: typography.size.body,
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.md,
  },
  countryList: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  option: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    padding: spacing.md,
  },
  optionTextGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  optionTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    lineHeight: typography.lineHeight.body,
  },
  optionCode: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
  selectedLabel: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.caption,
    minWidth: 64,
    textAlign: 'right',
  },
  empty: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    paddingVertical: spacing.xxl,
    textAlign: 'center',
  },
  languageOptions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  languageOption: {
    borderRadius: radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: spacing.lg,
  },
  languageName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
  footer: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.lg,
  },
  actionButtonLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
  error: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    textAlign: 'center',
  },
});
