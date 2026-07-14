import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

export type LegalDocument = 'privacy' | 'terms';

type LegalDocumentScreenProps = {
  document: LegalDocument;
  onBack: () => void;
};

const documentSections = {
  privacy: [
    { bodyKey: 'privacy.collectionBody', titleKey: 'privacy.collectionTitle' },
    { bodyKey: 'privacy.useBody', titleKey: 'privacy.useTitle' },
    { bodyKey: 'privacy.sharingBody', titleKey: 'privacy.sharingTitle' },
    { bodyKey: 'privacy.retentionBody', titleKey: 'privacy.retentionTitle' },
    { bodyKey: 'privacy.deletionBody', titleKey: 'privacy.deletionTitle' },
    { bodyKey: 'privacy.contactBody', titleKey: 'privacy.contactTitle' },
  ],
  terms: [
    { bodyKey: 'terms.eligibilityBody', titleKey: 'terms.eligibilityTitle' },
    { bodyKey: 'terms.accountBody', titleKey: 'terms.accountTitle' },
    { bodyKey: 'terms.acceptableUseBody', titleKey: 'terms.acceptableUseTitle' },
    { bodyKey: 'terms.subscriptionsBody', titleKey: 'terms.subscriptionsTitle' },
    { bodyKey: 'terms.availabilityBody', titleKey: 'terms.availabilityTitle' },
    { bodyKey: 'terms.contactBody', titleKey: 'terms.contactTitle' },
  ],
} as const;

export function LegalDocumentScreen({ document, onBack }: LegalDocumentScreenProps) {
  const { t } = useTranslation('legal');
  const { theme } = useTheme();
  const sections = documentSections[document];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel={t('back')}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>{t('back')}</Text>
        </Pressable>
        <View style={styles.introduction}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t(`${document}.title`)}
          </Text>
          <Text style={[styles.updated, { color: theme.colors.textMuted }]}>{t('updated')}</Text>
          <Text style={[styles.intro, { color: theme.colors.textMuted }]}>{t(`${document}.intro`)}</Text>
        </View>
        {sections.map((section) => (
          <View
            key={section.titleKey}
            style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t(section.titleKey)}
            </Text>
            <Text style={[styles.sectionBody, { color: theme.colors.textMuted }]}>
              {t(section.bodyKey)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg },
  backButton: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  introduction: { gap: spacing.xs },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  updated: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  intro: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  section: { borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  sectionTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  sectionBody: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
});
