import type { i18n as I18nInstance } from 'i18next';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FoundationScreen } from '@/features/foundation/FoundationScreen';
import { OnboardingFlowScreen } from '@/features/onboarding/OnboardingFlowScreen';
import {
  loadOnboardingPreferences,
} from '@/features/onboarding/data/onboardingPreferencesStorage';
import type { OnboardingPreferences } from '@/features/onboarding/domain/preferences';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type GateState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; preferences: OnboardingPreferences };

async function readPreferencesAndApplyLocale(i18n: I18nInstance) {
  const preferences = await loadOnboardingPreferences();

  if (preferences.locale) {
    await i18n.changeLanguage(preferences.locale);
  }

  return preferences;
}

export function OnboardingGate() {
  const { i18n, t } = useTranslation('onboarding');
  const { theme } = useTheme();
  const [state, setState] = useState<GateState>({ status: 'loading' });

  useEffect(() => {
    let isActive = true;

    void readPreferencesAndApplyLocale(i18n)
      .then((preferences) => {
        if (isActive) {
          setState({ status: 'ready', preferences });
        }
      })
      .catch(() => {
        if (isActive) {
          setState({ status: 'error' });
        }
      });

    return () => {
      isActive = false;
    };
  }, [i18n]);

  function retryLoad() {
    setState({ status: 'loading' });
    void readPreferencesAndApplyLocale(i18n)
      .then((preferences) =>
        setState({ status: 'ready', preferences }),
      )
      .catch(() => setState({ status: 'error' }));
  }

  if (state.status === 'loading') {
    return (
      <SafeAreaView
        accessibilityLabel={t('loading')}
        style={[
          styles.centeredScreen,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator
          accessibilityLabel={t('loading')}
          color={theme.colors.primary}
          size="large"
        />
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          {t('loading')}
        </Text>
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView
        style={[
          styles.centeredScreen,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.colors.text }]}
        >
          {t('loadErrorTitle')}
        </Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          {t('loadErrorBody')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={retryLoad}
          style={({ pressed }) => [
            styles.retryButton,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text
            style={[styles.retryLabel, { color: theme.colors.onPrimary }]}
          >
            {t('retry')}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (state.preferences.isComplete) {
    return <FoundationScreen />;
  }

  return (
    <OnboardingFlowScreen
      initialPreferences={state.preferences}
      onComplete={(preferences) =>
        setState({ status: 'ready', preferences })
      }
    />
  );
}

const styles = StyleSheet.create({
  centeredScreen: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.title,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
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
