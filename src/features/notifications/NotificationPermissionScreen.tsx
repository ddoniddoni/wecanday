import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NotificationPermissionResult } from '@/features/notifications/services/notificationPermissionService';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type NotificationPermissionScreenProps = {
  onAllow: () => Promise<NotificationPermissionResult>;
  onContinue: () => void;
  onNotNow: () => void;
};

export function NotificationPermissionScreen({
  onAllow,
  onContinue,
  onNotNow,
}: NotificationPermissionScreenProps) {
  const { t } = useTranslation('notifications');
  const { theme } = useTheme();
  const [result, setResult] = useState<NotificationPermissionResult | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  async function handleAllow() {
    setIsRequesting(true);

    try {
      setResult(await onAllow());
    } catch {
      setResult('denied');
    } finally {
      setIsRequesting(false);
    }
  }

  const resultCopyKey = result === 'granted' ? 'granted' : 'denied';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {result === null ? (
          <>
            <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
              {t('primer.eyebrow')}
            </Text>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
              {t('primer.title')}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              {t('primer.description')}
            </Text>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={isRequesting}
                onPress={() => void handleAllow()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: pressed || isRequesting ? 0.72 : 1,
                  },
                ]}
              >
                {isRequesting ? (
                  <ActivityIndicator
                    accessibilityLabel={t('primer.requesting')}
                    color={theme.colors.onPrimary}
                  />
                ) : (
                  <Text style={[styles.primaryLabel, { color: theme.colors.onPrimary }]}>
                    {t('primer.allow')}
                  </Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isRequesting}
                onPress={onNotNow}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    borderColor: theme.colors.border,
                    opacity: pressed || isRequesting ? 0.72 : 1,
                  },
                ]}
              >
                <Text style={[styles.secondaryLabel, { color: theme.colors.text }]}>
                  {t('primer.notNow')}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View accessibilityRole="alert" style={styles.result}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t(`result.${resultCopyKey}.title`)}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              {t(`result.${resultCopyKey}.description`)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onContinue}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.colors.primary, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.primaryLabel, { color: theme.colors.onPrimary }]}>
                {t('result.continue')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.lg },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  primaryButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  primaryLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  secondaryButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  secondaryLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  result: { gap: spacing.md },
});
