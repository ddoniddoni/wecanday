import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import type { ThemePreference } from '@/theme/types';
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';

const DISPLAY_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];
const CHARACTER_PREFERENCES: readonly ThemePreference[] = ['pixel-default'];

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
            const isSelected = option === preference;
            const isSaving = option === savingPreference;
            return (
              <Pressable accessibilityLabel={t(`theme.options.${option}.label`)} accessibilityRole="radio" accessibilityState={{ busy: isSaving, checked: isSelected }} disabled={savingPreference !== null} key={option} onPress={() => void selectPreference(option)} style={({ pressed }) => [styles.option, { backgroundColor: theme.colors.surface, borderColor: isSelected ? theme.colors.primary : theme.colors.border, opacity: pressed || savingPreference ? 0.72 : 1 }]}>
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
        <View style={styles.options}>
          {CHARACTER_PREFERENCES.map((option) => {
            const isSelected = option === preference;
            const isSaving = option === savingPreference;

            return (
              <Pressable accessibilityLabel={t(`theme.options.${option}.label`)} accessibilityRole="radio" accessibilityState={{ busy: isSaving, checked: isSelected }} disabled={savingPreference !== null} key={option} onPress={() => void selectPreference(option)} style={({ pressed }) => [styles.characterOption, { backgroundColor: theme.colors.surface, borderColor: isSelected ? theme.colors.primary : theme.colors.border, opacity: pressed || savingPreference ? 0.72 : 1 }]}>
                <ThemePreview option={option} />
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{t(`theme.options.${option}.label`)}</Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textMuted }]}>{t(`theme.options.${option}.description`)}</Text>
                  <PixelPalettePreview label={t('theme.options.pixel-default.previewLabel')} />
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

function ThemePreview({ option }: { option: ThemePreference }) {
  const previewBackground = option === 'dark'
    ? palette.darkBackground
    : option === 'pixel-default'
      ? palette.pixelSky
      : palette.lightBackground;
  const previewSurface = option === 'dark'
    ? palette.darkSurface
    : option === 'pixel-default'
      ? palette.pixelCloud
      : palette.lightSurface;
  const previewAccent = option === 'dark'
    ? palette.darkPrimary
    : option === 'pixel-default'
      ? palette.pixelCoral
      : palette.lightPrimary;

  return (
    <View style={[styles.preview, { backgroundColor: previewBackground }]}>
      <View style={[styles.previewHeader, { backgroundColor: previewSurface }]} />
      <View style={[styles.previewCard, { backgroundColor: previewSurface }]}>
        <View style={[styles.previewLine, { backgroundColor: previewAccent }]} />
        <View style={[styles.previewLine, styles.previewLineShort, { backgroundColor: previewAccent }]} />
      </View>
    </View>
  );
}

function PixelPalettePreview({ label }: { label: string }) {
  return (
    <View accessibilityLabel={label} style={styles.pixelPalette}>
      {[palette.pixelInk, palette.pixelShade, palette.pixelSky, palette.pixelCloud, palette.pixelCoral, palette.pixelGold].map((color) => (
        <View key={color} style={[styles.pixelSwatch, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum },
  backIcon: { fontSize: typography.size.title, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.title },
  content: { gap: spacing.lg, padding: spacing.lg },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  error: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  groupTitle: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerSpacer: { width: touchTarget.minimum },
  option: { alignItems: 'center', borderRadius: radii.md, borderWidth: 2, flexBasis: '47%', flexGrow: 1, gap: spacing.sm, minHeight: 180, padding: spacing.md },
  characterOption: { alignItems: 'center', borderRadius: radii.md, borderWidth: 2, flexDirection: 'row', gap: spacing.md, minHeight: touchTarget.minimum * 2.2, padding: spacing.md },
  optionCopy: { flex: 1, gap: spacing.xs },
  optionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  optionTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  options: { gap: spacing.sm },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preview: { borderRadius: radii.sm, height: 64, overflow: 'hidden', padding: spacing.xs, width: '100%' },
  previewHeader: { borderRadius: 3, height: 10, marginBottom: spacing.xs },
  previewCard: { borderRadius: radii.sm, flex: 1, gap: spacing.xs, justifyContent: 'center', padding: spacing.xs },
  previewLine: { borderRadius: radii.pill, height: 4, width: '80%' },
  previewLineShort: { width: '52%' },
  pixelPalette: { flexDirection: 'row', gap: 2, marginTop: spacing.xs },
  pixelSwatch: { height: 12, width: 12 },
  radio: { borderRadius: radii.pill, borderWidth: 2, height: 18, width: 18 },
  screen: { flex: 1 },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
});
