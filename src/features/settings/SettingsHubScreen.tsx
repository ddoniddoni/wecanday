import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import { type ComponentProps, type PropsWithChildren, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';

type SettingsHubScreenProps = {
  onBack: () => void;
  onOpenAccount: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTermsOfService: () => void;
  onOpenTheme: () => void;
  onSignOut: () => Promise<void>;
};

type SettingsRowProps = {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  iconBackground: string;
  iconColor: string;
  isDestructive?: boolean;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
};

export function SettingsHubScreen({
  onBack,
  onOpenAccount,
  onOpenPrivacyPolicy,
  onOpenTermsOfService,
  onOpenTheme,
  onSignOut,
}: SettingsHubScreenProps) {
  const { t } = useTranslation('settings');
  const { theme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasSignOutError, setHasSignOutError] = useState(false);

  async function handleSignOut() {
    setHasSignOutError(false);
    setIsSigningOut(true);

    try {
      await onSignOut();
    } catch {
      setHasSignOutError(true);
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={t('hub.back')}
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.64 : 1 }]}
          >
            <MaterialIcons color={theme.colors.focus} name="arrow-back" size={24} />
          </Pressable>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t('hub.title')}
          </Text>
          <View style={styles.headerButton} />
        </View>

        <SettingsSection title={t('hub.appSettings')}>
          <SettingsRow
            icon="notifications-none"
            iconBackground={palette.lightSecondarySoft}
            iconColor={palette.lightSecondaryDark}
            label={t('hub.notifications')}
            onPress={() => void Linking.openSettings()}
            showChevron
          />
          <SettingsRow
            icon="palette"
            iconBackground={palette.lightAccentSoft}
            iconColor={palette.lightAccentDark}
            label={t('hub.theme')}
            onPress={onOpenTheme}
            showChevron
          />
        </SettingsSection>

        <SettingsSection title={t('hub.account')}>
          <SettingsRow
            icon="logout"
            iconBackground={palette.errorContainer}
            iconColor={palette.error}
            isDestructive
            label={t('hub.logout')}
            onPress={() => void handleSignOut()}
          />
          <SettingsRow
            icon="manage-accounts"
            iconBackground={palette.lightContainerHigh}
            iconColor={theme.colors.textMuted}
            label={t('hub.accountDetails')}
            onPress={onOpenAccount}
            showChevron
          />
        </SettingsSection>

        <SettingsSection title={t('hub.legal')}>
          <SettingsRow
            icon="description"
            iconBackground={palette.lightContainerHigh}
            iconColor={theme.colors.textMuted}
            label={t('hub.terms')}
            onPress={onOpenTermsOfService}
            showChevron
          />
          <SettingsRow
            icon="privacy-tip"
            iconBackground={palette.lightContainerHigh}
            iconColor={theme.colors.textMuted}
            label={t('hub.privacy')}
            onPress={onOpenPrivacyPolicy}
            showChevron
          />
        </SettingsSection>

        {isSigningOut ? (
          <ActivityIndicator accessibilityLabel={t('hub.signingOut')} color={theme.colors.primary} />
        ) : null}
        {hasSignOutError ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: palette.error }]}>
            {t('hub.signOutError')}
          </Text>
        ) : null}
        <Text style={[styles.version, { color: theme.colors.textMuted }]}>
          {t('hub.version', { version: Constants.expoConfig?.version ?? '0.1.0' })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({ children, title }: PropsWithChildren<{ title: string }>) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  iconBackground,
  iconColor,
  isDestructive = false,
  label,
  onPress,
  showChevron = false,
}: SettingsRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.colors.border, opacity: pressed ? 0.64 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
        <MaterialIcons color={iconColor} name={icon} size={22} />
      </View>
      <Text style={[styles.rowLabel, { color: isDestructive ? palette.error : theme.colors.text }]}>
        {label}
      </Text>
      {showChevron ? <MaterialIcons color={theme.colors.text} name="chevron-right" size={22} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxl, paddingHorizontal: spacing.md },
  error: { fontFamily: typography.family.body, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 56 },
  headerButton: { alignItems: 'center', height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum },
  row: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 58, paddingVertical: spacing.sm },
  rowIcon: { alignItems: 'center', borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 },
  rowLabel: { flex: 1, fontFamily: typography.family.body, fontSize: 15, lineHeight: 22 },
  rows: { gap: 0 },
  screen: { flex: 1 },
  section: { gap: spacing.xs },
  sectionTitle: { fontFamily: typography.family.bold, fontSize: 11, letterSpacing: 1, lineHeight: 16, textTransform: 'uppercase' },
  title: { fontFamily: typography.family.bold, fontSize: 20, lineHeight: 28 },
  version: { fontFamily: typography.family.body, fontSize: 10, lineHeight: 14, marginTop: spacing.lg, textAlign: 'center' },
});
