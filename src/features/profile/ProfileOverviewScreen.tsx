import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
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

const quickActionIcons: Record<ProfileQuickActionProps['icon'], ComponentProps<typeof MaterialIcons>['name']> = {
  account: 'manage-accounts',
  appearance: 'palette',
  language: 'language',
  pet: 'pets',
};

const achievementBadges: readonly {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  key: 'early' | 'hydrated' | 'iron' | 'perfect' | 'sleep' | 'streak';
}[] = [
  { icon: 'local-fire-department', key: 'streak' },
  { icon: 'wb-sunny', key: 'early' },
  { icon: 'verified', key: 'perfect' },
  { icon: 'fitness-center', key: 'iron' },
  { icon: 'bedtime', key: 'sleep' },
  { icon: 'water-drop', key: 'hydrated' },
];

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
      <MaterialIcons color={theme.colors.focus} name={quickActionIcons[icon]} size={28} />
      <Text numberOfLines={1} style={[styles.quickActionLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
    </Pressable>
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
          <Pressable
            accessibilityLabel={t('account.action')}
            accessibilityRole="button"
            onPress={onOpenAccountSettings}
            style={({ pressed }) => [styles.settingsButton, { opacity: pressed ? 0.64 : 1 }]}
          >
            <MaterialIcons color={palette.darkMuted} name="settings" size={26} />
          </Pressable>
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
              {
                backgroundColor: theme.colors.primary,
                borderBottomColor: theme.colors.focus,
                opacity: pressed ? 0.72 : 1,
              },
              pressed && styles.friendButtonPressed,
            ]}
          >
            <MaterialIcons color={theme.colors.onPrimary} name="person-add" size={18} />
            <Text style={[styles.friendButtonLabel, { color: theme.colors.onPrimary }]}>
              {t('friends.action')}
            </Text>
          </Pressable>
        </View>
        <View style={styles.achievementHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('achievements.title')}</Text>
          <View style={[styles.earnedChip, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.earnedChipLabel, { color: theme.colors.onPrimary }]}>
              {t('achievements.earned', { count: 0 })}
            </Text>
          </View>
        </View>
        <View style={styles.achievementGrid}>
          {achievementBadges.map((badge) => (
            <View
              accessibilityLabel={t('achievements.lockedLabel', { name: t(`achievements.badges.${badge.key}`) })}
              key={badge.key}
              style={[styles.achievementCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={[styles.achievementIcon, { backgroundColor: palette.lightContainerHigh }]}>
                <MaterialIcons color={theme.colors.textMuted} name={badge.icon} size={28} />
              </View>
              <Text numberOfLines={2} style={[styles.achievementLabel, { color: theme.colors.textMuted }]}>
                {t(`achievements.badges.${badge.key}`)}
              </Text>
            </View>
          ))}
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
            <MaterialIcons color={theme.colors.onPrimary} name="workspace-premium" size={24} />
          </View>
          <View style={styles.premiumCopy}>
            <Text style={[styles.premiumTitle, { color: theme.colors.text }]}>{t('premium.title')}</Text>
            <Text style={[styles.premiumDescription, { color: theme.colors.textMuted }]}>
              {t('premium.description')}
            </Text>
          </View>
          <MaterialIcons color={theme.colors.focus} name="chevron-right" size={26} />
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
  achievementCard: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.md, borderWidth: 2, flexBasis: '30%', flexGrow: 1, gap: spacing.xs, minHeight: 112, padding: spacing.sm },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  achievementHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  achievementIcon: { alignItems: 'center', borderRadius: radii.pill, height: 54, justifyContent: 'center', width: 54 },
  achievementLabel: { fontFamily: typography.family.bold, fontSize: 10, lineHeight: 14, textAlign: 'center' },
  content: { flexGrow: 1, gap: spacing.lg, paddingBottom: spacing.xxl, paddingHorizontal: spacing.md },
  profileHero: { alignItems: 'center', borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl, gap: spacing.sm, marginHorizontal: -spacing.md, padding: spacing.xl, position: 'relative' },
  avatarFrame: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 3, height: 112, justifyContent: 'center', overflow: 'hidden', width: 112 },
  avatar: { height: 104, width: 104 },
  title: { fontFamily: typography.family.extraBold, fontSize: typography.size.title, lineHeight: typography.lineHeight.title, textAlign: 'center' },
  codeChip: { borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  codeChipLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  earnedChip: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  earnedChipLabel: { fontFamily: typography.family.bold, fontSize: 10, lineHeight: 14 },
  memberSince: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  friendButton: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.sm, minHeight: touchTarget.minimum, paddingHorizontal: spacing.xl },
  friendButtonPressed: { borderBottomWidth: 0, transform: [{ translateY: 4 }] },
  friendButtonLabel: { fontFamily: typography.family.bold, fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  settingsButton: { alignItems: 'center', height: touchTarget.minimum, justifyContent: 'center', position: 'absolute', right: spacing.md, top: spacing.md, width: touchTarget.minimum },
  sectionHeader: { gap: spacing.xs },
  sectionTitle: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading },
  sectionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  quickActions: { flexDirection: 'row', gap: spacing.sm },
  quickAction: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flex: 1, gap: spacing.sm, justifyContent: 'center', minHeight: touchTarget.minimum * 1.8, paddingHorizontal: spacing.xs },
  quickActionLabel: { fontSize: 11, fontWeight: typography.weight.bold, lineHeight: 14, textAlign: 'center' },
  premiumCard: { alignItems: 'center', borderRadius: radii.md, borderWidth: 2, flexDirection: 'row', gap: spacing.md, minHeight: touchTarget.minimum * 1.6, padding: spacing.md },
  premiumIcon: { alignItems: 'center', borderRadius: radii.sm, height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum },
  premiumCopy: { flex: 1, gap: spacing.xs },
  premiumTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  premiumDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
});
