import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type PublicCodeShareCardProps = {
  onFindFriend: () => void;
  publicCode: string;
};

export function PublicCodeShareCard({
  onFindFriend,
  publicCode,
}: PublicCodeShareCardProps) {
  const { t } = useTranslation('friends');
  const { theme } = useTheme();
  const [actionState, setActionState] = useState<'idle' | 'copying' | 'copied' | 'error' | 'sharing'>('idle');

  async function handleCopy() {
    setActionState('copying');

    try {
      await Clipboard.setStringAsync(publicCode);
      setActionState('copied');
    } catch {
      setActionState('error');
    }
  }

  async function handleShare() {
    setActionState('sharing');

    try {
      await Share.share(
        {
          message: t('publicCode.shareMessage', { code: publicCode }),
          title: t('publicCode.shareTitle'),
        },
        { dialogTitle: t('publicCode.shareTitle') },
      );
      setActionState('idle');
    } catch {
      setActionState('error');
    }
  }

  const isBusy = actionState === 'copying' || actionState === 'sharing';
  const feedback = actionState === 'copied'
    ? t('publicCode.copied')
    : actionState === 'error'
      ? t('publicCode.error')
      : null;

  return (
    <View
      accessibilityLabel={t('publicCode.accessibilityLabel', { code: publicCode })}
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('publicCode.title')}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('publicCode.description')}</Text>
      </View>
      <Text accessibilityRole="text" style={[styles.code, { color: theme.colors.primary }]}>{publicCode}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={t('publicCode.copy')}
          accessibilityRole="button"
          accessibilityState={{ busy: actionState === 'copying' }}
          disabled={isBusy}
          onPress={() => void handleCopy()}
          style={({ pressed }) => [
            styles.button,
            { borderColor: theme.colors.border, opacity: pressed || isBusy ? 0.72 : 1 },
          ]}
        >
          <Text style={[styles.buttonLabel, { color: theme.colors.text }]}>{t('publicCode.copy')}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={t('publicCode.share')}
          accessibilityRole="button"
          accessibilityState={{ busy: actionState === 'sharing' }}
          disabled={isBusy}
          onPress={() => void handleShare()}
          style={({ pressed }) => [
            styles.button,
            { borderColor: theme.colors.border, opacity: pressed || isBusy ? 0.72 : 1 },
          ]}
        >
          <Text style={[styles.buttonLabel, { color: theme.colors.text }]}>{t('publicCode.share')}</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityLabel={t('search.open')}
        accessibilityRole="button"
        disabled={isBusy}
        onPress={onFindFriend}
        style={({ pressed }) => [
          styles.findFriendButton,
          { borderColor: theme.colors.border, opacity: pressed || isBusy ? 0.72 : 1 },
        ]}
      >
        <Text style={[styles.buttonLabel, { color: theme.colors.text }]}>
          {t('search.open')}
        </Text>
      </Pressable>
      {feedback ? (
        <Text accessibilityRole={actionState === 'error' ? 'alert' : 'text'} style={[styles.feedback, { color: actionState === 'error' ? theme.colors.text : theme.colors.primary }]}>
          {feedback}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  copy: { gap: spacing.xs },
  title: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  code: { fontSize: typography.size.title, fontWeight: typography.weight.bold, letterSpacing: 2, lineHeight: typography.lineHeight.title },
  findFriendButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  button: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  buttonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  feedback: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
});
