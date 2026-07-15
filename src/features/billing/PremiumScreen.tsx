import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type PremiumScreenProps = {
  onClose: () => void;
};

type PremiumPackageKind = 'annual' | 'monthly';

export function PremiumScreen({ onClose }: PremiumScreenProps) {
  const { t } = useTranslation('billing');
  const { theme } = useTheme();
  const [selectedKind, setSelectedKind] = useState<PremiumPackageKind>('annual');

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={t('close')}
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Text style={[styles.closeLabel, { color: theme.colors.text }]}>×</Text>
          </Pressable>
          <Text style={[styles.brand, { color: theme.colors.text }]}>{t('brand')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.crown, { backgroundColor: theme.colors.primary }]}>
          <Text accessibilityElementsHidden style={[styles.crownLabel, { color: theme.colors.onPrimary }]}>✦</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t('title')}
          </Text>
          <Text style={[styles.accentTitle, { color: theme.colors.primary }]}>{t('accentTitle')}</Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('description')}</Text>
        </View>

        <View style={styles.benefitGrid}>
          <BenefitCard icon="∞" label={t('benefits.unlimited.title')} description={t('benefits.unlimited.description')} />
          <BenefitCard icon="↗" label={t('benefits.insights.title')} description={t('benefits.insights.description')} />
          <BenefitCard icon="✦" label={t('benefits.coaching.title')} description={t('benefits.coaching.description')} isWide />
        </View>

        <View style={styles.packageList}>
          <PackageCard
            isSelected={selectedKind === 'annual'}
            kind="annual"
            onPress={() => setSelectedKind('annual')}
          />
          <PackageCard
            isSelected={selectedKind === 'monthly'}
            kind="monthly"
            onPress={() => setSelectedKind('monthly')}
          />
        </View>

        <View
          style={[
            styles.previewNotice,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.previewTitle, { color: theme.colors.text }]}>{t('preview.title')}</Text>
          <Text style={[styles.previewDescription, { color: theme.colors.textMuted }]}>
            {t('preview.description')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={[
            styles.primaryButton,
            { backgroundColor: theme.colors.primary, opacity: 0.64 },
          ]}
        >
          <Text style={[styles.primaryButtonLabel, { color: theme.colors.onPrimary }]}>
            {t('comingSoon')}
          </Text>
        </Pressable>
        <Text style={[styles.legal, { color: theme.colors.textMuted }]}>{t('legal')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function BenefitCard({
  description,
  icon,
  isWide = false,
  label,
}: {
  description: string;
  icon: string;
  isWide?: boolean;
  label: string;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.benefitCard,
        isWide && styles.benefitCardWide,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={[styles.benefitIcon, { borderColor: theme.colors.primary }]}>
        <Text style={[styles.benefitIconLabel, { color: theme.colors.primary }]}>{icon}</Text>
      </View>
      <View style={styles.benefitCopy}>
        <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.benefitDescription, { color: theme.colors.textMuted }]}>{description}</Text>
      </View>
    </View>
  );
}

function PackageCard({
  isSelected,
  kind,
  onPress,
}: {
  isSelected: boolean;
  kind: PremiumPackageKind;
  onPress: () => void;
}) {
  const { t } = useTranslation('billing');
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={t(`packages.${kind}.accessibilityLabel`)}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.packageCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View style={[styles.packageRadio, { borderColor: isSelected ? theme.colors.primary : theme.colors.textMuted }]}>
        {isSelected ? <View style={[styles.packageRadioDot, { backgroundColor: theme.colors.primary }]} /> : null}
      </View>
      <View style={styles.packageCopy}>
        <Text style={[styles.packageTitle, { color: theme.colors.text }]}>{t(`packages.${kind}.title`)}</Text>
        <Text style={[styles.packageDescription, { color: theme.colors.textMuted }]}>{t(`packages.${kind}.description`)}</Text>
      </View>
      <View style={styles.priceCopy}>
        <Text style={[styles.pricePending, { color: isSelected ? theme.colors.primary : theme.colors.textMuted }]}>
          {t('packages.pricePending')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  closeButton: { alignItems: 'center', height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum },
  closeLabel: { fontSize: typography.size.heading, lineHeight: typography.lineHeight.heading },
  brand: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  headerSpacer: { width: touchTarget.minimum },
  crown: { alignItems: 'center', alignSelf: 'center', borderRadius: radii.sm, height: 58, justifyContent: 'center', width: 132 },
  crownLabel: { fontSize: typography.size.display, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.display },
  heroCopy: { alignItems: 'center', gap: spacing.xs },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title, textAlign: 'center' },
  accentTitle: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title, textAlign: 'center' },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, maxWidth: 330, textAlign: 'center' },
  benefitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  benefitCard: { borderRadius: radii.md, borderWidth: 1, flexBasis: '47%', flexDirection: 'row', flexGrow: 1, gap: spacing.sm, minHeight: 92, padding: spacing.sm },
  benefitCardWide: { flexBasis: '100%', minHeight: 72 },
  benefitIcon: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 1, height: 34, justifyContent: 'center', width: 34 },
  benefitIconLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  benefitCopy: { flex: 1 },
  benefitTitle: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  benefitDescription: { fontSize: 11, lineHeight: 15 },
  packageList: { gap: spacing.sm },
  packageCard: { alignItems: 'center', borderRadius: radii.md, borderWidth: 2, flexDirection: 'row', gap: spacing.md, minHeight: 92, padding: spacing.md },
  packageRadio: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 2, height: 22, justifyContent: 'center', width: 22 },
  packageRadioDot: { borderRadius: radii.pill, height: 12, width: 12 },
  packageCopy: { flex: 1 },
  packageTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  packageDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  priceCopy: { alignItems: 'flex-end' },
  pricePending: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  previewNotice: { borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  previewTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  previewDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  primaryButton: { alignItems: 'center', borderRadius: radii.sm, justifyContent: 'center', minHeight: touchTarget.minimum * 1.2, paddingHorizontal: spacing.lg },
  primaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  legal: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
