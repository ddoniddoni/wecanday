import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppTabScreen } from '@/components/AppTabScreen';
import { PublicCodeShareCard } from '@/features/friends/PublicCodeShareCard';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type ProfileOverviewScreenProps = {
  displayName: string;
  onOpenAccountSettings: () => void;
  onOpenCompanionSelection: () => void;
  onOpenFriendSearch: () => void;
  onOpenLanguageSelection: () => void;
  onOpenPlans: () => void;
  onOpenStatistics: () => void;
  onOpenThemes: () => void;
  onOpenToday: () => void;
  publicCode: string;
};

type ProfileQuickActionProps = {
  accessibilityLabel: string;
  icon: 'account' | 'appearance' | 'language' | 'pet';
  onPress: () => void;
};

function ProfileQuickAction({
  accessibilityLabel,
  icon,
  onPress,
}: ProfileQuickActionProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <ProfileQuickActionIcon color={theme.colors.primary} icon={icon} />
    </Pressable>
  );
}

function ProfileQuickActionIcon({
  color,
  icon,
}: {
  color: string;
  icon: ProfileQuickActionProps['icon'];
}) {
  if (icon === 'pet') {
    return (
      <View style={styles.petIcon}>
        <View style={[styles.petEar, styles.petEarStart, { backgroundColor: color }]} />
        <View style={[styles.petEar, styles.petEarEnd, { backgroundColor: color }]} />
        <View style={[styles.petFace, { borderColor: color }]}>
          <View style={[styles.petEye, { backgroundColor: color }]} />
          <View style={[styles.petEye, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  if (icon === 'language') {
    return (
      <View style={[styles.languageIcon, { borderColor: color }]}>
        <View style={[styles.languageMeridian, { borderColor: color }]} />
        <View style={[styles.languageEquator, { backgroundColor: color }]} />
      </View>
    );
  }

  if (icon === 'appearance') {
    return (
      <View style={styles.appearanceIcon}>
        <View style={[styles.appearanceCore, { borderColor: color }]} />
        <View style={[styles.appearanceRay, styles.appearanceRayTop, { backgroundColor: color }]} />
        <View style={[styles.appearanceRay, styles.appearanceRayBottom, { backgroundColor: color }]} />
        <View style={[styles.appearanceRay, styles.appearanceRayStart, { backgroundColor: color }]} />
        <View style={[styles.appearanceRay, styles.appearanceRayEnd, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.accountIcon}>
      <View style={[styles.accountHead, { backgroundColor: color }]} />
      <View style={[styles.accountBody, { borderColor: color }]} />
    </View>
  );
}

export function ProfileOverviewScreen({
  displayName,
  onOpenAccountSettings,
  onOpenCompanionSelection,
  onOpenFriendSearch,
  onOpenLanguageSelection,
  onOpenPlans,
  onOpenStatistics,
  onOpenThemes,
  onOpenToday,
  publicCode,
}: ProfileOverviewScreenProps) {
  const { t } = useTranslation('profile');
  const { theme } = useTheme();

  return (
    <AppTabScreen
      activeTab="profile"
      navigation={{
        onOpenPlans,
        onOpenProfile: () => undefined,
        onOpenStatistics,
        onOpenToday,
      }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>{t('eyebrow')}</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t('title', { name: displayName })}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('description')}</Text>
        </View>
        <PublicCodeShareCard onFindFriend={onOpenFriendSearch} publicCode={publicCode} />
        <View style={styles.quickActions}>
          <ProfileQuickAction
            accessibilityLabel={t('companion.action')}
            icon="pet"
            onPress={onOpenCompanionSelection}
          />
          <ProfileQuickAction
            accessibilityLabel={t('language.action')}
            icon="language"
            onPress={onOpenLanguageSelection}
          />
          <ProfileQuickAction
            accessibilityLabel={t('appearance.action')}
            icon="appearance"
            onPress={onOpenThemes}
          />
          <ProfileQuickAction
            accessibilityLabel={t('account.action')}
            icon="account"
            onPress={onOpenAccountSettings}
          />
        </View>
      </ScrollView>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
  header: { gap: spacing.sm, paddingTop: spacing.md },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 0.8, lineHeight: typography.lineHeight.caption },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  quickActions: { flexDirection: 'row', gap: spacing.sm },
  quickAction: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: touchTarget.minimum * 1.5 },
  petIcon: { height: 28, position: 'relative', width: 30 },
  petEar: { borderRadius: radii.pill, height: 11, position: 'absolute', top: 1, width: 9 },
  petEarStart: { left: 2, transform: [{ rotate: '-28deg' }] },
  petEarEnd: { right: 2, transform: [{ rotate: '28deg' }] },
  petFace: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 2, bottom: 0, flexDirection: 'row', gap: 6, height: 21, justifyContent: 'center', left: 3, position: 'absolute', width: 24 },
  petEye: { borderRadius: radii.pill, height: 3, width: 3 },
  languageIcon: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 2, height: 26, justifyContent: 'center', overflow: 'hidden', width: 26 },
  languageMeridian: { borderLeftWidth: 2, borderRightWidth: 2, borderRadius: radii.pill, height: 26, width: 10 },
  languageEquator: { height: 2, position: 'absolute', width: '100%' },
  appearanceIcon: { alignItems: 'center', height: 28, justifyContent: 'center', position: 'relative', width: 28 },
  appearanceCore: { borderRadius: radii.pill, borderWidth: 2, height: 14, width: 14 },
  appearanceRay: { borderRadius: radii.pill, height: 4, position: 'absolute', width: 2 },
  appearanceRayTop: { top: 0 },
  appearanceRayBottom: { bottom: 0 },
  appearanceRayStart: { left: 1, transform: [{ rotate: '90deg' }] },
  appearanceRayEnd: { right: 1, transform: [{ rotate: '90deg' }] },
  accountIcon: { alignItems: 'center', height: 28, justifyContent: 'space-between', width: 28 },
  accountHead: { borderRadius: radii.pill, height: 10, width: 10 },
  accountBody: { borderLeftWidth: 2, borderRightWidth: 2, borderTopLeftRadius: radii.pill, borderTopRightRadius: radii.pill, borderTopWidth: 2, height: 12, width: 22 },
});
