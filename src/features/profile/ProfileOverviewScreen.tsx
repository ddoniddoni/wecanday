import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryNavigation } from '@/components/PrimaryNavigation';
import { PublicCodeShareCard } from '@/features/friends/PublicCodeShareCard';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type ProfileOverviewScreenProps = {
  displayName: string;
  onOpenAccountSettings: () => void;
  onOpenCompanionSelection: () => void;
  onOpenFriendSearch: () => void;
  onOpenPlans: () => void;
  onOpenStatistics: () => void;
  onOpenThemes: () => void;
  onOpenToday: () => void;
  publicCode: string;
};

type ProfileActionCardProps = {
  actionLabel: string;
  description: string;
  onPress: () => void;
  title: string;
};

function ProfileActionCard({
  actionLabel,
  description,
  onPress,
  title,
}: ProfileActionCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.actionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.actionDescription, { color: theme.colors.textMuted }]}>{description}</Text>
      </View>
      <Pressable
        accessibilityLabel={actionLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: theme.colors.primary, opacity: pressed ? 0.72 : 1 },
        ]}
      >
        <Text style={[styles.actionButtonLabel, { color: theme.colors.onPrimary }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

export function ProfileOverviewScreen({
  displayName,
  onOpenAccountSettings,
  onOpenCompanionSelection,
  onOpenFriendSearch,
  onOpenPlans,
  onOpenStatistics,
  onOpenThemes,
  onOpenToday,
  publicCode,
}: ProfileOverviewScreenProps) {
  const { t } = useTranslation('profile');
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>{t('eyebrow')}</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t('title', { name: displayName })}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('description')}</Text>
        </View>
        <PublicCodeShareCard onFindFriend={onOpenFriendSearch} publicCode={publicCode} />
        <ProfileActionCard
          actionLabel={t('companion.action')}
          description={t('companion.description')}
          onPress={onOpenCompanionSelection}
          title={t('companion.title')}
        />
        <ProfileActionCard
          actionLabel={t('appearance.action')}
          description={t('appearance.description')}
          onPress={onOpenThemes}
          title={t('appearance.title')}
        />
        <ProfileActionCard
          actionLabel={t('account.action')}
          description={t('account.description')}
          onPress={onOpenAccountSettings}
          title={t('account.title')}
        />
      </ScrollView>
      <PrimaryNavigation
        activeTab="profile"
        onOpenPlans={onOpenPlans}
        onOpenProfile={() => undefined}
        onOpenStatistics={onOpenStatistics}
        onOpenToday={onOpenToday}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
  header: { gap: spacing.sm, paddingTop: spacing.md },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 0.8, lineHeight: typography.lineHeight.caption },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  actionCard: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  actionCopy: { gap: spacing.xs },
  actionTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  actionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  actionButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  actionButtonLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
});
