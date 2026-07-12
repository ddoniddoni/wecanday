import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type AuthErrorCode,
  getAuthErrorCode,
} from '@/features/auth/domain/authErrors';
import { signInWithApple } from '@/features/auth/services/appleSignIn';
import { signInWithOAuthProvider } from '@/features/auth/services/oauthSignIn';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type ProviderButtonProps = {
  isDisabled: boolean;
  label: string;
  onPress: () => void;
};

function ProviderButton({
  isDisabled,
  label,
  onPress,
}: ProviderButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.providerButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={[styles.providerLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function AppleProviderButton({
  isDisabled,
  label,
  onPress,
}: ProviderButtonProps) {
  const { theme } = useTheme();

  if (Platform.OS !== 'ios') {
    return (
      <ProviderButton
        isDisabled={isDisabled}
        label={label}
        onPress={onPress}
      />
    );
  }

  return (
    <View
      accessibilityState={{ disabled: isDisabled }}
      pointerEvents={isDisabled ? 'none' : 'auto'}
      style={{ opacity: isDisabled ? 0.5 : 1 }}
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonStyle={
          theme.isDark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        buttonType={
          AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
        }
        cornerRadius={radii.lg}
        onPress={onPress}
        style={styles.appleButton}
      />
    </View>
  );
}

const errorTranslationKeys = {
  AUTH_CONFIGURATION_MISSING: 'configurationError',
  AUTH_PROFILE_UNAVAILABLE: 'profileError',
  AUTH_PROVIDER_CANCELLED: 'cancelled',
  AUTH_PROVIDER_FAILED: 'providerError',
  AUTH_TOKEN_MISSING: 'providerError',
} as const satisfies Record<AuthErrorCode, string>;

export function LoginScreen() {
  const { t } = useTranslation('auth');
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);

  async function runSignIn(signIn: () => Promise<'success' | 'cancelled'>) {
    setIsSubmitting(true);
    setErrorCode(null);

    try {
      const result = await signIn();

      if (result === 'cancelled') {
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
    } catch (error) {
      setErrorCode(getAuthErrorCode(error));
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
          {t('eyebrow')}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.colors.text }]}
        >
          {t('title')}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t('description')}
        </Text>
        <View style={styles.providers}>
          <AppleProviderButton
            isDisabled={isSubmitting}
            label={t('googleButton')}
            onPress={() =>
              void runSignIn(() => signInWithOAuthProvider('google'))
            }
          />
          <ProviderButton
            isDisabled={isSubmitting}
            label={t('appleButton')}
            onPress={() => void runSignIn(signInWithApple)}
          />
        </View>
        {errorCode && errorCode !== 'AUTH_PROVIDER_CANCELLED' ? (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: theme.colors.text }]}
          >
            {t(errorTranslationKeys[errorCode])}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
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
  description: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  providers: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  providerButton: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: touchTarget.minimum,
    padding: spacing.md,
  },
  appleButton: {
    height: 52,
    width: '100%',
  },
  providerLabel: {
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
