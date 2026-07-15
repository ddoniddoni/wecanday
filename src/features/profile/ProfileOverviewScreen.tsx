import { format } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppTabScreen } from '@/components/AppTabScreen';
import {
  getCompanionAsset,
  type CompanionId,
} from '@/features/companion/domain/companions';
import { PublicCodeShareCard } from '@/features/friends/PublicCodeShareCard';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';

type ProfileOverviewScreenProps = {
  companionId: CompanionId;
  createdAt: string;
  displayName: string;
  onOpenAccountSettings: () => void;
  onOpenCompanionSelection: () => void;
  onOpenCommunity?: () => void;
  onOpenFriendSearch: () => void;
  onOpenLanguageSelection: () => void;
  onOpenPremium: () => void;
  onOpenPlans: () => void;
  onOpenStatistics: () => void;
  onOpenThemes: () => void;
  onOpenToday: () => void;
  publicCode: string;
};

const noOp = () => undefined;

type ProfileQuickActionProps = {
  accessibilityLabel: string;
  icon: 'account' | 'appearance' | 'language' | 'pet';
  label: string;
  onPress: () => void;
};

function ProfileQuickAction({
  accessibilityLabel,
  icon,
  label,
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
      <Text numberOfLines={1} style={[styles.quickActionLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
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
  companionId,
  createdAt,
  displayName,
  onOpenAccountSettings,
  onOpenCompanionSelection,
  onOpenCommunity = noOp,
  onOpenFriendSearch,
  onOpenLanguageSelection,
  onOpenPremium,
  onOpenPlans,
  onOpenStatistics,
  onOpenThemes,
  onOpenToday,
  publicCode,
}: ProfileOverviewScreenProps) {
  const { i18n, t } = useTranslation('profile');
  const { theme } = useTheme();

  return (
    <AppTabScreen
      activeTab="profile"
      navigation={{
        onOpenCommunity,
        onOpenPlans,
        onOpenProfile: () => undefined,
        onOpenStatistics,
        onOpenToday,
      }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileHero, { backgroundColor: palette.darkBackground }]}>
          <View style={[styles.avatarFrame, { borderColor: theme.colors.primary }]}>
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel={t('companion.avatarLabel', { name: displayName })}
              contentFit="contain"
              source={getCompanionAsset(companionId)}
              style={styles.avatar}
            />
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: palette.darkText }]}>
            {displayName}
          </Text>
          <View style={[styles.codeChip, { borderColor: palette.darkBorder }]}>
            <Text style={[styles.codeChipLabel, { color: palette.darkMuted }]}>#{publicCode}</Text>
          </View>
          <Text style={[styles.memberSince, { color: palette.darkMuted }]}>
            {t('memberSince', { date: formatMemberSince(createdAt, i18n.language) })}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenFriendSearch}
            style={({ pressed }) => [
              styles.friendButton,
              { backgroundColor: theme.colors.primary, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.friendButtonLabel, { color: theme.colors.onPrimary }]}>
              {t('friends.action')}
            </Text>
          </Pressable>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('toolsTitle')}</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            {t('description')}
          </Text>
        </View>
        <View style={styles.quickActions}>
          <ProfileQuickAction
            accessibilityLabel={t('companion.action')}
            icon="pet"
            label={t('companion.shortTitle')}
            onPress={onOpenCompanionSelection}
          />
          <ProfileQuickAction
            accessibilityLabel={t('language.action')}
            icon="language"
            label={t('language.shortTitle')}
            onPress={onOpenLanguageSelection}
          />
          <ProfileQuickAction
            accessibilityLabel={t('appearance.action')}
            icon="appearance"
            label={t('appearance.shortTitle')}
            onPress={onOpenThemes}
          />
          <ProfileQuickAction
            accessibilityLabel={t('account.action')}
            icon="account"
            label={t('account.shortTitle')}
            onPress={onOpenAccountSettings}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenPremium}
          style={({ pressed }) => [
            styles.premiumCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <View style={[styles.premiumIcon, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.premiumIconLabel, { color: theme.colors.onPrimary }]}>✦</Text>
          </View>
          <View style={styles.premiumCopy}>
            <Text style={[styles.premiumTitle, { color: theme.colors.text }]}>{t('premium.title')}</Text>
            <Text style={[styles.premiumDescription, { color: theme.colors.textMuted }]}>
              {t('premium.description')}
            </Text>
          </View>
          <Text accessibilityElementsHidden style={[styles.chevron, { color: theme.colors.primary }]}>›</Text>
        </Pressable>
        <PublicCodeShareCard onFindFriend={onOpenFriendSearch} publicCode={publicCode} />
      </ScrollView>
    </AppTabScreen>
  );
}

function formatMemberSince(createdAt: string, locale: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  const isKorean = locale.startsWith('ko');

  return format(date, isKorean ? 'yyyy년 M월' : 'MMM yyyy', { locale: isKorean ? ko : enUS });
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
  profileHero: { alignItems: 'center', borderRadius: radii.xl, gap: spacing.sm, padding: spacing.xl },
  avatarFrame: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 3, height: 112, justifyContent: 'center', overflow: 'hidden', width: 112 },
  avatar: { height: 104, width: 104 },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title, textAlign: 'center' },
  codeChip: { borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  codeChipLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  memberSince: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  friendButton: { alignItems: 'center', borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.sm, minHeight: touchTarget.minimum, paddingHorizontal: spacing.xl },
  friendButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  sectionHeader: { gap: spacing.xs },
  sectionTitle: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading },
  sectionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  quickActions: { flexDirection: 'row', gap: spacing.sm },
  quickAction: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flex: 1, gap: spacing.sm, justifyContent: 'center', minHeight: touchTarget.minimum * 1.8, paddingHorizontal: spacing.xs },
  quickActionLabel: { fontSize: 11, fontWeight: typography.weight.bold, lineHeight: 14, textAlign: 'center' },
  premiumCard: { alignItems: 'center', borderRadius: radii.md, borderWidth: 2, flexDirection: 'row', gap: spacing.md, minHeight: touchTarget.minimum * 1.6, padding: spacing.md },
  premiumIcon: { alignItems: 'center', borderRadius: radii.sm, height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum },
  premiumIconLabel: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading },
  premiumCopy: { flex: 1, gap: spacing.xs },
  premiumTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  premiumDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  chevron: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
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
