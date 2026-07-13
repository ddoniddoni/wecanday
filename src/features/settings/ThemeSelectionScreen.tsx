import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import type { ThemePreference } from '@/theme/types';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark', 'pixel-default'];

type ThemeSelectionScreenProps = {
  onBack: () => void;
  onSave: (preference: ThemePreference) => Promise<void>;
};

export function ThemeSelectionScreen({ onBack, onSave }: ThemeSelectionScreenProps) {
  const { t } = useTranslation('settings');
  const { preference, setPreference, theme } = useTheme();
  const [savingPreference, setSavingPreference] = useState<ThemePreference | null>(null);
  const [hasSaveError, setHasSaveError] = useState(false);

  async function selectPreference(nextPreference: ThemePreference) {
    if (nextPreference === preference || savingPreference) return;

    setHasSaveError(false);
    setSavingPreference(nextPreference);
    setPreference(nextPreference);
    try {
      await onSave(nextPreference);
    } catch {
      setPreference(preference);
      setHasSaveError(true);
    } finally {
      setSavingPreference(null);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityLabel={t('theme.back')} accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 }]}>
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>{t('theme.back')}</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>{t('theme.eyebrow')}</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{t('theme.title')}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('theme.description')}</Text>
        <View style={styles.options}>
          {PREFERENCES.map((option) => {
            const isSelected = option === preference;
            const isSaving = option === savingPreference;
            return (
              <Pressable accessibilityLabel={t(`theme.options.${option}.label`)} accessibilityRole="radio" accessibilityState={{ busy: isSaving, checked: isSelected }} disabled={savingPreference !== null} key={option} onPress={() => void selectPreference(option)} style={({ pressed }) => [styles.option, { backgroundColor: theme.colors.surface, borderColor: isSelected ? theme.colors.primary : theme.colors.border, opacity: pressed || savingPreference ? 0.72 : 1 }]}>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{t(`theme.options.${option}.label`)}</Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textMuted }]}>{t(`theme.options.${option}.description`)}</Text>
                </View>
                {isSaving ? <ActivityIndicator accessibilityLabel={t('theme.saving')} color={theme.colors.primary} /> : <View style={[styles.radio, { borderColor: theme.colors.primary, backgroundColor: isSelected ? theme.colors.primary : theme.colors.background }]} />}
              </Pressable>
            );
          })}
        </View>
        {hasSaveError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>{t('theme.saveError')}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, minHeight: touchTarget.minimum, justifyContent: 'center', paddingHorizontal: spacing.md },
  backLabel: { fontSize: typography.size.body, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.body },
  content: { gap: spacing.md, padding: spacing.md },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption, textTransform: 'uppercase' },
  error: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  option: { alignItems: 'center', borderRadius: radii.md, borderWidth: 2, flexDirection: 'row', gap: spacing.md, minHeight: touchTarget.minimum * 1.5, padding: spacing.md },
  optionCopy: { flex: 1, gap: spacing.xs },
  optionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  optionTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  options: { gap: spacing.sm },
  radio: { borderRadius: radii.pill, borderWidth: 2, height: spacing.md, width: spacing.md },
  screen: { flex: 1 },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
});
