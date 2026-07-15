import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type AuthErrorCode,
  getAuthErrorCode,
} from '@/features/auth/domain/authErrors';
import { signInWithGoogle } from '@/features/auth/services/oauthSignIn';
import { getCompanionAsset } from '@/features/companion/domain/companions';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

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
        contentFit="contain"
        source={googleLogo}
        style={styles.googleLogo}
        testID="google-sign-in-logo"
      />
      <Text style={styles.googleButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const errorTranslationKeys = {
  ACCOUNT_DELETION_FAILED: 'providerError',
  AUTH_CONFIGURATION_MISSING: 'configurationError',
  AUTH_PROFILE_UNAVAILABLE: 'profileError',
  AUTH_PROVIDER_CANCELLED: 'cancelled',
  AUTH_PROVIDER_FAILED: 'providerError',
  AUTH_TOKEN_MISSING: 'providerError',
  INVALID_DISPLAY_NAME: 'providerError',
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.brandCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Image
            accessibilityLabel={t('brandImageAccessibilityLabel')}
            accessibilityRole="image"
            contentFit="contain"
            source={getCompanionAsset('sprout')}
            style={styles.brandImage}
          />
          <Text style={[styles.brandTitle, { color: theme.colors.primary }]}>{t('brandTitle')}</Text>
          <Text style={[styles.brandTagline, { color: theme.colors.textMuted }]}>{t('brandTagline')}</Text>
        </View>
        <View style={styles.authCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t('loginTitle')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {t('description')}
          </Text>
        </View>
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
        <Text style={[styles.legal, { color: theme.colors.textMuted }]}>{t('legalNotice')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.md,
  },
  brandCard: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  brandImage: { height: 176, width: '100%' },
  brandTitle: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading },
  brandTagline: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  authCopy: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  title: {
    fontSize: typography.size.heading,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.heading,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    textAlign: 'center',
  },
  providers: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: googleButton.borderColor,
    borderRadius: radii.sm,
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
  legal: { fontSize: 11, lineHeight: 15, marginTop: spacing.sm, textAlign: 'center' },
});
