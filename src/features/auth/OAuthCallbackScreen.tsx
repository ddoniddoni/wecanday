import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exchangeOAuthCallbackCode } from '@/features/auth/services/oauthSignIn';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type CallbackStatus = 'loading' | 'error';

type OAuthCallbackScreenProps = {
  code: string | null;
  onComplete?: () => void;
  onReturnToSignIn: () => void;
  exchangeCode?: (code: string) => Promise<void>;
};

export function OAuthCallbackScreen({
  code,
  onComplete,
  onReturnToSignIn,
  exchangeCode = exchangeOAuthCallbackCode,
}: OAuthCallbackScreenProps) {
  const { t } = useTranslation('auth');
  const { theme } = useTheme();
  const completedCode = useRef<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  const [status, setStatus] = useState<CallbackStatus>(() =>
    code ? 'loading' : 'error',
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!code || completedCode.current === code) {
      return;
    }

    let isActive = true;

    completedCode.current = code;
    setStatus('loading');

    void exchangeCode(code)
      .then(() => {
        if (isActive) {
          onCompleteRef.current?.();
        }
      })
      .catch(() => {
        if (isActive) {
          setStatus('error');
        }
      });

    return () => {
      isActive = false;
    };
  }, [code, exchangeCode]);

  const isLoading = status === 'loading';

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator
            accessibilityLabel={t('callbackLoading')}
            color={theme.colors.primary}
            size="large"
          />
        ) : null}
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.colors.text }]}
        >
          {isLoading ? t('callbackLoading') : t('providerError')}
        </Text>
        {isLoading ? null : (
          <Pressable
            accessibilityLabel={t('returnToSignIn')}
            accessibilityRole="button"
            onPress={onReturnToSignIn}
            style={({ pressed }) => [
              styles.returnButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.returnLabel, { color: theme.colors.onPrimary }]}>
              {t('returnToSignIn')}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
  },
  returnButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.lg,
  },
  returnLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
});
