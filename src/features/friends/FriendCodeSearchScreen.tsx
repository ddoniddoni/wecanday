import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getFriendSearchErrorCode,
  isPublicCode,
  type FriendSearchErrorCode,
} from '@/features/friends/domain/friendSearch';
import { lookupFriendByPublicCode } from '@/features/friends/services/friendSearchService';
import type { Database, FriendCodeLookupRow } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type FriendCodeSearchScreenProps = {
  client: SupabaseClient<Database>;
  onBack: () => void;
};

export function FriendCodeSearchScreen({
  client,
  onBack,
}: FriendCodeSearchScreenProps) {
  const { t } = useTranslation('friends');
  const { theme } = useTheme();
  const [publicCode, setPublicCode] = useState('');
  const [result, setResult] = useState<FriendCodeLookupRow | null | undefined>();
  const [errorCode, setErrorCode] = useState<FriendSearchErrorCode | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function search() {
    setResult(undefined);
    setErrorCode(null);

    if (!isPublicCode(publicCode)) {
      setErrorCode('INVALID_PUBLIC_CODE');
      return;
    }

    setIsSearching(true);
    try {
      setResult(await lookupFriendByPublicCode(client, publicCode));
    } catch (error) {
      setErrorCode(getFriendSearchErrorCode(error));
    } finally {
      setIsSearching(false);
    }
  }

  const statusMessage = errorCode
    ? t(`search.errors.${errorCode}`)
    : result === null
      ? t('search.notFound')
      : null;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Pressable
          accessibilityLabel={t('search.back')}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>
            {t('search.back')}
          </Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t('search.title')}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t('search.description')}
        </Text>
        <TextInput
          accessibilityLabel={t('search.inputLabel')}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSearching}
          maxLength={12}
          onChangeText={(value) => setPublicCode(value)}
          placeholder={t('search.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={publicCode}
        />
        <Pressable
          accessibilityLabel={t('search.submit')}
          accessibilityRole="button"
          accessibilityState={{ busy: isSearching }}
          disabled={isSearching}
          onPress={() => void search()}
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed || isSearching ? 0.72 : 1,
            },
          ]}
        >
          {isSearching ? (
            <ActivityIndicator accessibilityLabel={t('search.searching')} color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.submitLabel, { color: theme.colors.onPrimary }]}>
              {t('search.submit')}
            </Text>
          )}
        </Pressable>
        {statusMessage ? (
          <Text
            accessibilityRole={errorCode ? 'alert' : 'text'}
            style={[styles.status, { color: errorCode ? theme.colors.text : theme.colors.textMuted }]}
          >
            {statusMessage}
          </Text>
        ) : null}
        {result ? (
          <View
            accessibilityLabel={t('search.resultAccessibilityLabel', {
              displayName: result.display_name,
            })}
            style={[styles.result, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.resultEyebrow, { color: theme.colors.textMuted }]}>
              {t('search.resultEyebrow')}
            </Text>
            <Text style={[styles.resultName, { color: theme.colors.text }]}>
              {result.display_name}
            </Text>
            <Text style={[styles.resultAvatar, { color: theme.colors.textMuted }]}>
              {t('search.avatarPreview', { seed: result.avatar_seed })}
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backLabel: { fontSize: typography.size.body, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.body },
  content: { flex: 1, gap: spacing.md, padding: spacing.md },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  input: { borderRadius: radii.md, borderWidth: 1, fontSize: typography.size.body, letterSpacing: 1.25, minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  result: { borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  resultAvatar: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  resultEyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption, textTransform: 'uppercase' },
  resultName: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  screen: { flex: 1 },
  status: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  submitButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  submitLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
});
