import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function FoundationScreen() {
  const { t } = useTranslation(['common', 'onboarding']);
  const { theme } = useTheme();

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View
        accessibilityLabel={t('foundationReady')}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
          {t('appName')}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.colors.text }]}
        >
          {t('greeting', { ns: 'onboarding' })}
        </Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          {t('foundationReady')}
        </Text>
      </View>
    </View>
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
  body: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.regular,
    lineHeight: typography.lineHeight.body,
  },
});
