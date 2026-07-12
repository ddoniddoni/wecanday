import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type AuthErrorCode,
  getAuthErrorCode,
} from '@/features/auth/domain/authErrors';
import { signInWithGoogle } from '@/features/auth/services/oauthSignIn';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touchTarget, typography } from '@/theme/tokens';

type ProviderButtonProps = {
  isDisabled: boolean;
  label: string;
  onPress: () => void;
};

const googleLogo = require('../../../assets/brands/google-g-logo.png');

const googleButton = {
  borderColor: '#747775',
  height: 48,
  logoLeftPadding: 12,
  logoSize: 18,
  textColor: '#1F1F1F',
} as const;

function GoogleProviderButton({
  isDisabled,
  label,
  onPress,
}: ProviderButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.googleButton,
        {
          opacity: isDisabled ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={googleLogo}
        style={styles.googleLogo}
        testID="google-sign-in-logo"
      />
      <Text style={styles.googleButtonLabel}>{label}</Text>
    </Pressable>
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
          <GoogleProviderButton
            isDisabled={isSubmitting}
            label={t('googleButton')}
            onPress={() => void runSignIn(signInWithGoogle)}
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
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: googleButton.borderColor,
    borderRadius: googleButton.height / 2,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: Math.max(googleButton.height, touchTarget.minimum),
  },
  googleLogo: {
    height: googleButton.logoSize,
    left: googleButton.logoLeftPadding,
    position: 'absolute',
    resizeMode: 'contain',
    width: googleButton.logoSize,
  },
  googleButtonLabel: {
    color: googleButton.textColor,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  error: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    textAlign: 'center',
  },
});
