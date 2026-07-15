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
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

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
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
          {t('eyebrow')}
        </Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t('title')}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t('description')}
        </Text>

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
                <Text style={[styles.selectedLabel, { color: companionAccent.primary }]}>
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
  content: { gap: spacing.md, padding: spacing.lg },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 0.8, lineHeight: typography.lineHeight.caption },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  options: { gap: spacing.sm, marginTop: spacing.sm },
  option: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 2, flexDirection: 'row', gap: spacing.sm, minHeight: 124, padding: spacing.md },
  image: { height: 92, width: 80 },
  optionCopy: { flex: 1, gap: spacing.xs },
  optionName: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  optionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  selectedLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
  primaryButton: { alignItems: 'center', borderRadius: radii.pill, flex: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  secondaryButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  buttonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
});
