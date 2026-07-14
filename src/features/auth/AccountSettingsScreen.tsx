import { useState } from 'react';
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

import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type AccountSettingsScreenProps = {
  onBack: () => void;
  onDeleteAccount: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export function AccountSettingsScreen({
  onBack,
  onDeleteAccount,
  onSignOut,
}: AccountSettingsScreenProps) {
  const { t } = useTranslation('auth');
  const { theme } = useTheme();
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasDeletionError, setHasDeletionError] = useState(false);
  const [hasSignOutError, setHasSignOutError] = useState(false);

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
  secondaryButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  secondaryLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  dangerButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  dangerLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  confirmation: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  confirmationTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  confirmationActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  deleteConfirmButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  deleteConfirmLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
});
