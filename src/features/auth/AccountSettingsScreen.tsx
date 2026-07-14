import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type AccountSettingsScreenProps = {
  displayName: string;
  hapticsEnabled: boolean;
  onBack: () => void;
  onDeleteAccount: () => Promise<void>;
  onOpenPrivacyPolicy: () => void;
  onSaveHapticsPreference: (isEnabled: boolean) => Promise<void>;
  onSaveDisplayName: (displayName: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onOpenTermsOfService: () => void;
};

export function AccountSettingsScreen({
  displayName,
  hapticsEnabled,
  onBack,
  onDeleteAccount,
  onOpenPrivacyPolicy,
  onSaveHapticsPreference,
  onSaveDisplayName,
  onSignOut,
  onOpenTermsOfService,
}: AccountSettingsScreenProps) {
  const { t } = useTranslation('auth');
  const { theme } = useTheme();
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasDeletionError, setHasDeletionError] = useState(false);
  const [hasSignOutError, setHasSignOutError] = useState(false);
  const [nickname, setNickname] = useState(displayName);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [hasNicknameError, setHasNicknameError] = useState(false);
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(hapticsEnabled);
  const [isSavingHaptics, setIsSavingHaptics] = useState(false);
  const [hasHapticsError, setHasHapticsError] = useState(false);

  async function handleHapticsChange(nextIsEnabled: boolean) {
    const previousIsEnabled = isHapticsEnabled;

    setHasHapticsError(false);
    setIsHapticsEnabled(nextIsEnabled);
    setIsSavingHaptics(true);

    try {
      await onSaveHapticsPreference(nextIsEnabled);
    } catch {
      setIsHapticsEnabled(previousIsEnabled);
      setHasHapticsError(true);
    } finally {
      setIsSavingHaptics(false);
    }
  }

  async function handleSaveNickname() {
    const normalizedNickname = nickname.trim();

    if (normalizedNickname.length === 0) {
      setHasNicknameError(true);
      return;
    }

    setHasNicknameError(false);
    setIsSavingNickname(true);

    try {
      await onSaveDisplayName(normalizedNickname);
      setNickname(normalizedNickname);
    } catch {
      setHasNicknameError(true);
    } finally {
      setIsSavingNickname(false);
    }
  }

  async function handleSignOut() {
    setHasSignOutError(false);
    setIsSigningOut(true);

    try {
      await onSignOut();
    } catch {
      setHasSignOutError(true);
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    setHasDeletionError(false);
    setIsDeleting(true);

    try {
      await onDeleteAccount();
    } catch {
      setHasDeletionError(true);
      setIsDeleting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel={t('account.back')}
          accessibilityRole="button"
          disabled={isDeleting || isSigningOut}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              borderColor: theme.colors.border,
              opacity: pressed || isDeleting || isSigningOut ? 0.72 : 1,
            },
          ]}
        >
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>{t('account.back')}</Text>
        </Pressable>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t('account.title')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {t('account.description')}
          </Text>
        </View>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('account.nicknameTitle')}</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            {t('account.nicknameDescription')}
          </Text>
          <TextInput
            accessibilityLabel={t('account.nicknameLabel')}
            autoCapitalize="words"
            maxLength={30}
            onChangeText={setNickname}
            placeholder={t('account.nicknamePlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.nicknameInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
            value={nickname}
          />
          <Pressable
            accessibilityLabel={t('account.saveNickname')}
            accessibilityRole="button"
            disabled={isDeleting || isSavingNickname || isSigningOut}
            onPress={() => void handleSaveNickname()}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed || isDeleting || isSavingNickname || isSigningOut ? 0.72 : 1,
              },
            ]}
          >
            {isSavingNickname ? (
              <ActivityIndicator accessibilityLabel={t('account.savingNickname')} color={theme.colors.text} />
            ) : (
              <Text style={[styles.secondaryLabel, { color: theme.colors.text }]}>{t('account.saveNickname')}</Text>
            )}
          </Pressable>
          {hasNicknameError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
              {t('account.nicknameError')}
            </Text>
          ) : null}
        </View>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('account.hapticsTitle')}
              </Text>
              <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
                {t('account.hapticsDescription')}
              </Text>
            </View>
            <Switch
              accessibilityLabel={t('account.hapticsLabel')}
              accessibilityRole="switch"
              accessibilityState={{ busy: isSavingHaptics, checked: isHapticsEnabled }}
              disabled={isDeleting || isSavingHaptics || isSigningOut}
              onValueChange={(nextIsEnabled) => void handleHapticsChange(nextIsEnabled)}
              thumbColor={theme.colors.surface}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              value={isHapticsEnabled}
            />
          </View>
          {hasHapticsError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
              {t('account.hapticsError')}
            </Text>
          ) : null}
        </View>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('account.legalTitle')}</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            {t('account.legalDescription')}
          </Text>
          <View style={styles.legalActions}>
            <Pressable
              accessibilityLabel={t('account.privacyPolicy')}
              accessibilityRole="button"
              disabled={isDeleting || isSigningOut}
              onPress={onOpenPrivacyPolicy}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed || isDeleting || isSigningOut ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryLabel, { color: theme.colors.text }]}>{t('account.privacyPolicy')}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t('account.termsOfService')}
              accessibilityRole="button"
              disabled={isDeleting || isSigningOut}
              onPress={onOpenTermsOfService}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed || isDeleting || isSigningOut ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryLabel, { color: theme.colors.text }]}>{t('account.termsOfService')}</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('account.signOutTitle')}</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            {t('account.signOutDescription')}
          </Text>
          <Pressable
            accessibilityLabel={t('signOut')}
            accessibilityRole="button"
            disabled={isDeleting || isSigningOut}
            onPress={() => void handleSignOut()}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed || isDeleting || isSigningOut ? 0.72 : 1,
              },
            ]}
          >
            {isSigningOut ? (
              <ActivityIndicator accessibilityLabel={t('account.signingOut')} color={theme.colors.text} />
            ) : (
              <Text style={[styles.secondaryLabel, { color: theme.colors.text }]}>{t('signOut')}</Text>
            )}
          </Pressable>
          {hasSignOutError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
              {t('signOutError')}
            </Text>
          ) : null}
        </View>
        <View style={[styles.dangerSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('account.deleteTitle')}</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            {t('account.deleteDescription')}
          </Text>
          {!isDeleteConfirmationVisible ? (
            <Pressable
              accessibilityLabel={t('account.deleteRequest')}
              accessibilityRole="button"
              disabled={isSigningOut}
              onPress={() => setIsDeleteConfirmationVisible(true)}
              style={({ pressed }) => [
                styles.dangerButton,
                {
                  borderColor: theme.colors.text,
                  opacity: pressed || isSigningOut ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.dangerLabel, { color: theme.colors.text }]}>{t('account.deleteRequest')}</Text>
            </Pressable>
          ) : (
            <View
              accessibilityRole="alert"
              style={[styles.confirmation, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
            >
              <Text style={[styles.confirmationTitle, { color: theme.colors.text }]}>
                {t('account.deleteConfirmationTitle')}
              </Text>
              <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
                {t('account.deleteConfirmationDescription')}
              </Text>
              <View style={styles.confirmationActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isDeleting}
                  onPress={() => setIsDeleteConfirmationVisible(false)}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      borderColor: theme.colors.border,
                      opacity: pressed || isDeleting ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.secondaryLabel, { color: theme.colors.text }]}>{t('account.cancel')}</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={t('account.deleteConfirm')}
                  accessibilityRole="button"
                  disabled={isDeleting}
                  onPress={() => void handleDeleteAccount()}
                  style={({ pressed }) => [
                    styles.deleteConfirmButton,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: pressed || isDeleting ? 0.72 : 1,
                    },
                  ]}
                >
                  {isDeleting ? (
                    <ActivityIndicator accessibilityLabel={t('account.deleting')} color={theme.colors.onPrimary} />
                  ) : (
                    <Text style={[styles.deleteConfirmLabel, { color: theme.colors.onPrimary }]}>{t('account.deleteConfirm')}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
          {hasDeletionError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
              {t('account.deleteError')}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg },
  backButton: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  copy: { gap: spacing.xs },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  section: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  dangerSection: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  sectionTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  sectionDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  settingCopy: { flex: 1, gap: spacing.xs },
  secondaryButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  secondaryLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  dangerButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  dangerLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  confirmation: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  confirmationTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  confirmationActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  nicknameInput: { borderRadius: radii.sm, borderWidth: 1, fontSize: typography.size.body, lineHeight: typography.lineHeight.body, minHeight: touchTarget.minimum, paddingHorizontal: spacing.sm },
  deleteConfirmButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  deleteConfirmLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
});
