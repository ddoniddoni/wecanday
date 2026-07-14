import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { localeOptions, resolveSupportedLocale, type SupportedLocale } from '@/i18n/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type LanguageSelectionScreenProps = {
  onBack: () => void;
  onSave: (locale: SupportedLocale) => Promise<void>;
};

export function LanguageSelectionScreen({ onBack, onSave }: LanguageSelectionScreenProps) {
  const { i18n, t } = useTranslation('settings');
  const { theme } = useTheme();
  const [savingLocale, setSavingLocale] = useState<SupportedLocale | null>(null);
  const [hasSaveError, setHasSaveError] = useState(false);
  const selectedLocale = resolveSupportedLocale(i18n.resolvedLanguage);

  async function selectLocale(nextLocale: SupportedLocale) {
    if (nextLocale === selectedLocale || savingLocale) {
      return;
    }

    const previousLocale = selectedLocale;
    setHasSaveError(false);
    setSavingLocale(nextLocale);

    try {
      await i18n.changeLanguage(nextLocale);
      await onSave(nextLocale);
    } catch {
      await i18n.changeLanguage(previousLocale);
      setHasSaveError(true);
    } finally {
      setSavingLocale(null);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel={t('language.back')}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>{t('language.back')}</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>{t('language.eyebrow')}</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t('language.title')}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t('language.description')}
        </Text>
        <View style={styles.options}>
          {localeOptions.map((option) => {
            const isSelected = option.code === selectedLocale;
            const isSaving = option.code === savingLocale;

            return (
              <Pressable
                accessibilityLabel={option.nativeName}
                accessibilityRole="radio"
                accessibilityState={{ busy: isSaving, checked: isSelected }}
                disabled={savingLocale !== null}
                key={option.code}
                onPress={() => void selectLocale(option.code)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    opacity: pressed || savingLocale ? 0.72 : 1,
                  },
                ]}
              >
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                  {option.nativeName}
                </Text>
                {isSaving ? (
                  <ActivityIndicator accessibilityLabel={t('language.saving')} color={theme.colors.primary} />
                ) : (
                  <View
                    style={[
                      styles.radio,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
        {hasSaveError ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
            {t('language.saveError')}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backLabel: { fontSize: typography.size.body, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.body },
  content: { gap: spacing.md, padding: spacing.md },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption, textTransform: 'uppercase' },
  error: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  option: { alignItems: 'center', borderRadius: radii.md, borderWidth: 2, flexDirection: 'row', justifyContent: 'space-between', minHeight: touchTarget.minimum * 1.25, padding: spacing.md },
  optionTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  options: { gap: spacing.sm },
  radio: { borderRadius: radii.pill, borderWidth: 2, height: spacing.md, width: spacing.md },
  screen: { flex: 1 },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
});
