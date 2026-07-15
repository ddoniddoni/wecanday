import { useState } from 'react';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  companionIds,
  getCompanionAsset,
  type CompanionId,
} from '@/features/companion/domain/companions';
import { getCompanionAccent } from '@/theme/companionAccent';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';

type CompanionSelectionScreenProps = {
  initialCompanionId?: CompanionId;
  onBack?: () => void;
  onSave: (companionId: CompanionId) => Promise<void>;
};

export function CompanionSelectionScreen({
  initialCompanionId = 'sprout',
  onBack,
  onSave,
}: CompanionSelectionScreenProps) {
  const { t } = useTranslation('companion');
  const { theme } = useTheme();
  const [selectedCompanionId, setSelectedCompanionId] =
    useState<CompanionId>(initialCompanionId);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setHasSaveError(false);
    setIsSaving(true);

    try {
      await onSave(selectedCompanionId);
    } catch {
      setHasSaveError(true);
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.primary }]}>
            {t('title')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {t('description')}
          </Text>
        </View>

        <View style={styles.options}>
          {companionIds.map((companionId) => {
            const isSelected = selectedCompanionId === companionId;
            const name = t(`options.${companionId}.name`);
            const companionAccent = getCompanionAccent(theme.id, companionId);

            return (
              <Pressable
                accessibilityLabel={t('optionAccessibilityLabel', { name })}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={companionId}
                onPress={() => setSelectedCompanionId(companionId)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isSelected ? companionAccent.primary : theme.colors.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Image
                  accessibilityLabel={t('imageAccessibilityLabel', { name })}
                  accessibilityRole="image"
                  contentFit="contain"
                  source={getCompanionAsset(companionId)}
                  style={styles.image}
                />
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionName, { color: theme.colors.text }]}>{name}</Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textMuted }]}>
                    {t(`options.${companionId}.description`)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.selectedLabel,
                    {
                      backgroundColor: isSelected ? companionAccent.primary : palette.transparent,
                      color: isSelected ? theme.colors.onPrimary : companionAccent.primary,
                    },
                  ]}
                >
                  {isSelected ? t('selected') : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {hasSaveError ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
            {t('saveError')}
          </Text>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={onBack}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: theme.colors.border, opacity: pressed || isSaving ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.buttonLabel, { color: theme.colors.text }]}>{t('back')}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => void handleSave()}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.colors.primary, opacity: pressed || isSaving ? 0.72 : 1 },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator accessibilityLabel={t('saving')} color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonLabel, { color: theme.colors.onPrimary }]}>{t('continue')}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.md },
  header: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  title: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  options: { gap: spacing.sm, marginTop: spacing.sm },
  option: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 2, gap: spacing.xs, minHeight: 216, padding: spacing.md },
  image: { height: 124, width: 124 },
  optionCopy: { alignItems: 'center', gap: spacing.xs },
  optionName: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  optionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  selectedLabel: { borderRadius: radii.pill, fontSize: 10, fontWeight: typography.weight.bold, lineHeight: 14, minHeight: 18, overflow: 'hidden', paddingHorizontal: spacing.sm, textAlign: 'center' },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  primaryButton: { alignItems: 'center', borderRadius: radii.sm, flex: 1, justifyContent: 'center', minHeight: 56, paddingHorizontal: spacing.md },
  secondaryButton: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  buttonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
});
