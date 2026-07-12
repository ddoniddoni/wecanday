import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/AuthProvider';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { ProfileHomeScreen } from '@/features/auth/ProfileHomeScreen';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

export function AuthGate() {
  const { t } = useTranslation('auth');
  const { theme } = useTheme();
  const auth = useAuth();

  if (auth.status === 'signed_out') {
    return <LoginScreen />;
  }

  if (auth.status === 'signed_in') {
    return <ProfileHomeScreen />;
  }

  const isLoading = auth.status === 'loading';
  const title =
    auth.status === 'configuration_error'
      ? t('configurationTitle')
      : t('profileErrorTitle');
  const description =
    auth.status === 'configuration_error'
      ? t('configurationDescription')
      : t('profileErrorDescription');

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      {isLoading ? (
        <>
          <ActivityIndicator
            accessibilityLabel={t('loading')}
            color={theme.colors.primary}
            size="large"
          />
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {t('loading')}
          </Text>
        </>
      ) : (
        <View style={styles.messageGroup}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.colors.text }]}
          >
            {title}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {description}
          </Text>
          {auth.status === 'profile_error' ? (
            <Pressable
              accessibilityRole="button"
              onPress={auth.retry}
              style={({ pressed }) => [
                styles.retryButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={[styles.retryLabel, { color: theme.colors.onPrimary }]}>
                {t('retry')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  messageGroup: {
    gap: spacing.md,
    width: '100%',
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.title,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.lg,
  },
  retryLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
});
