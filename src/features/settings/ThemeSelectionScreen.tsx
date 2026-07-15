import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  companionIds,
  getCompanionAsset,
  type CompanionId,
} from '@/features/companion/domain/companions';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeId, ThemePreference } from '@/theme/types';
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';

const DISPLAY_PREFERENCES: readonly ThemeId[] = ['light', 'dark'];
type ThemeSelectionScreenProps = {
  companionId?: CompanionId;
  onBack: () => void;
  onSave: (preference: ThemePreference) => Promise<void>;
  onSaveCompanion?: (companionId: CompanionId) => Promise<void>;
};

export function ThemeSelectionScreen({
  companionId = 'sprout',
  onBack,
  onSave,
  onSaveCompanion,
}: ThemeSelectionScreenProps) {
  const { t } = useTranslation('settings');
  const { preference, setPreference, theme } = useTheme();
  const [savingPreference, setSavingPreference] = useState<ThemePreference | null>(null);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [selectedCompanionId, setSelectedCompanionId] = useState(companionId);
  const [savingCompanionId, setSavingCompanionId] = useState<CompanionId | null>(null);

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

  async function selectCompanion(nextCompanionId: CompanionId) {
    if (nextCompanionId === selectedCompanionId || savingCompanionId || !onSaveCompanion) return;

    const previousCompanionId = selectedCompanionId;
    setHasSaveError(false);
    setSelectedCompanionId(nextCompanionId);
    setSavingCompanionId(nextCompanionId);

    try {
      await onSaveCompanion(nextCompanionId);
    } catch {
      setSelectedCompanionId(previousCompanionId);
      setHasSaveError(true);
    } finally {
      setSavingCompanionId(null);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('theme.back')} accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.72 : 1 }]}>
            <Text style={[styles.backIcon, { color: theme.colors.text }]}>‹</Text>
          </Pressable>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{t('theme.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('theme.description')}</Text>
        <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{t('theme.displayModeTitle')}</Text>
        <View style={styles.optionsGrid}>
          {DISPLAY_PREFERENCES.map((option) => {
            const isSelected = option === theme.id;
            const isSaving = option === savingPreference;
            return (
              <Pressable accessibilityLabel={t(`theme.options.${option}.label`)} accessibilityRole="radio" accessibilityState={{ busy: isSaving, checked: isSelected }} disabled={savingPreference !== null} key={option} onPress={() => void selectPreference(option)} style={({ pressed }) => [styles.option, { backgroundColor: theme.colors.surface, borderColor: isSelected ? theme.colors.primary : theme.colors.border, borderBottomColor: isSelected ? theme.colors.focus : theme.colors.border, opacity: pressed || savingPreference ? 0.72 : 1 }]}>
                <ThemePreview option={option} />
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{t(`theme.options.${option}.label`)}</Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textMuted }]}>{t(`theme.options.${option}.description`)}</Text>
                </View>
                {isSaving ? <ActivityIndicator accessibilityLabel={t('theme.saving')} color={theme.colors.primary} /> : <View style={[styles.radio, { borderColor: theme.colors.primary, backgroundColor: isSelected ? theme.colors.primary : theme.colors.background }]} />}
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{t('theme.characterThemeTitle')}</Text>
        <View style={styles.characterGrid}>
          {companionIds.map((option) => {
            const isSelected = selectedCompanionId === option;
            const isSaving = savingCompanionId === option;

            return (
              <Pressable
                accessibilityLabel={t(`theme.characterOptions.${option}`)}
                accessibilityRole="radio"
                accessibilityState={{ busy: isSaving, checked: isSelected }}
                disabled={savingPreference !== null || savingCompanionId !== null || !onSaveCompanion}
                key={option}
                onPress={() => void selectCompanion(option)}
                style={({ pressed }) => [
                  styles.characterOption,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderBottomColor: isSelected ? theme.colors.focus : theme.colors.border,
                    opacity: pressed || savingPreference || savingCompanionId ? 0.72 : 1,
                  },
                ]}
              >
                <Image contentFit="contain" source={getCompanionAsset(option)} style={styles.characterImage} />
                <Text style={[styles.characterLabel, { color: theme.colors.text }]}>
                  {t(`theme.characterOptions.${option}`)}
                </Text>
                {isSaving ? <ActivityIndicator accessibilityLabel={t('theme.saving')} color={theme.colors.primary} /> : isSelected ? <MaterialIcons color={theme.colors.focus} name="check-circle" size={18} /> : null}
              </Pressable>
            );
          })}
        </View>
        {hasSaveError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>{t('theme.saveError')}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemePreview({ option }: { option: ThemeId }) {
  const previewBackground = option === 'dark'
    ? palette.darkBackground
    : palette.lightBackground;
  const previewSurface = option === 'dark'
    ? palette.darkSurface
    : palette.lightSurface;
  const previewAccent = option === 'dark'
    ? palette.darkPrimary
    : palette.lightPrimary;

  return (
    <View style={[styles.preview, { backgroundColor: previewBackground }]}>
      <View style={[styles.previewIcon, { backgroundColor: previewSurface }]}>
        <MaterialIcons
          color={previewAccent}
          name={option === 'dark' ? 'dark-mode' : 'light-mode'}
          size={26}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum },
  backIcon: { fontSize: typography.size.title, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.title },
  content: { gap: spacing.lg, padding: spacing.lg },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  error: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  groupTitle: { fontFamily: typography.family.bold, fontSize: 18, lineHeight: 26 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerSpacer: { width: touchTarget.minimum },
  option: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.md, borderWidth: 2, flexBasis: '47%', flexGrow: 1, gap: spacing.sm, minHeight: 124, padding: spacing.md },
  characterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  characterImage: { height: 58, width: 58 },
  characterLabel: { fontFamily: typography.family.bold, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  characterOption: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.md, borderWidth: 2, flexBasis: '47%', flexGrow: 1, gap: spacing.xs, minHeight: 126, padding: spacing.sm },
  optionCopy: { flex: 1, gap: spacing.xs },
  optionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  optionTitle: { fontFamily: typography.family.bold, fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preview: { alignItems: 'center', borderRadius: radii.sm, height: 60, justifyContent: 'center', padding: spacing.xs, width: '100%' },
  previewIcon: { alignItems: 'center', borderRadius: radii.pill, height: 46, justifyContent: 'center', width: 46 },
  radio: { borderRadius: radii.pill, borderWidth: 2, height: 18, width: 18 },
  screen: { flex: 1 },
  title: { fontFamily: typography.family.extraBold, fontSize: 24, lineHeight: 32 },
});
