import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

export function ProfileHomeScreen() {
  const { t } = useTranslation('auth');
  const { theme } = useTheme();
  const auth = useAuth();
  const [hasSignOutError, setHasSignOutError] = useState(false);

  if (auth.status !== 'signed_in') {
    return null;
  }

  async function handleSignOut() {
    setHasSignOutError(false);

    try {
      await auth.signOut();
    } catch {
      setHasSignOutError(true);
    }
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
          {t('signedInEyebrow')}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.colors.text }]}
        >
          {auth.profile.display_name}
        </Text>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>
          {t('publicCodeLabel')}
        </Text>
        <Text
          accessibilityLabel={t('publicCodeAccessibilityLabel', {
            code: auth.profile.public_code,
          })}
          selectable
          style={[styles.code, { color: theme.colors.text }]}
        >
          {auth.profile.public_code}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [
            styles.signOutButton,
            {
              borderColor: theme.colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={[styles.signOutLabel, { color: theme.colors.text }]}>
            {t('signOut')}
          </Text>
        </Pressable>
        {hasSignOutError ? (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: theme.colors.text }]}
          >
            {t('signOutError')}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  eyebrow: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.caption,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.title,
  },
  label: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
  code: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    letterSpacing: 2,
    lineHeight: typography.lineHeight.body,
  },
  signOutButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.lg,
  },
  signOutLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
  error: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    textAlign: 'center',
  },
});
