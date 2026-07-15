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
      onBack?.();
    } catch {
      setHasSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
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
                    borderBottomColor: isSelected ? companionAccent.focus : theme.colors.border,
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
                      color: isSelected ? companionAccent.onPrimary : companionAccent.primary,
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
            {
              backgroundColor: theme.colors.primary,
              borderBottomColor: theme.colors.focus,
              opacity: pressed || isSaving ? 0.72 : 1,
            },
            pressed && styles.buttonPressed,
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
  title: { fontFamily: typography.family.extraBold, fontSize: typography.size.heading, lineHeight: typography.lineHeight.heading, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  option: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.sm, borderWidth: 2, flexBasis: '47%', flexGrow: 1, gap: spacing.xs, minHeight: 218, padding: spacing.sm },
  image: { height: 104, width: 104 },
  optionCopy: { alignItems: 'center', gap: spacing.xs },
  optionName: { fontFamily: typography.family.bold, fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  optionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  selectedLabel: { borderRadius: radii.pill, fontSize: 10, fontWeight: typography.weight.bold, lineHeight: 14, minHeight: 18, overflow: 'hidden', paddingHorizontal: spacing.sm, textAlign: 'center' },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  primaryButton: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.sm, flex: 1, justifyContent: 'center', minHeight: 56, paddingHorizontal: spacing.md },
  buttonPressed: { borderBottomWidth: 0, transform: [{ translateY: 4 }] },
  secondaryButton: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  buttonLabel: { fontFamily: typography.family.bold, fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
});
