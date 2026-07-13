import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getChallengeErrorCode, type ChallengeErrorCode } from '@/features/challenges/domain/challengeErrors';
import { loadChallengeInvitations, respondToChallengeInvitation } from '@/features/challenges/services/challengeService';
import type { ChallengeInvitationRow, Database } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type ChallengeInvitationsScreenProps = {
  client: SupabaseClient<Database>;
  onBack: () => void;
};

export function ChallengeInvitationsScreen({ client, onBack }: ChallengeInvitationsScreenProps) {
  const { t } = useTranslation('challenges');
  const { theme } = useTheme();
  const [invitations, setInvitations] = useState<ChallengeInvitationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorCode, setErrorCode] = useState<ChallengeErrorCode | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorCode(null);
    try {
      setInvitations(await loadChallengeInvitations(client));
    } catch (error) {
      setErrorCode(getChallengeErrorCode(error));
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(initialRefresh);
  }, [refresh]);

  async function respond(invitation: ChallengeInvitationRow, response: 'accepted' | 'declined') {
    setIsMutating(true);
    setErrorCode(null);
    try {
      await respondToChallengeInvitation(client, invitation.id, response);
      await refresh();
    } catch (error) {
      setErrorCode(getChallengeErrorCode(error));
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityLabel={t('invitations.back')} accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 }]}>
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>{t('invitations.back')}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{t('invitations.title')}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('invitations.description')}</Text>
        {isLoading ? (
          <ActivityIndicator accessibilityLabel={t('invitations.loading')} color={theme.colors.primary} />
        ) : invitations.length === 0 && !errorCode ? (
          <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{t('invitations.empty')}</Text>
        ) : (
          invitations.map((invitation) => (
            <View key={invitation.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{invitation.title}</Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{t('invitations.from', { creatorName: invitation.creator_name })}</Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{t('invitations.dates', { startsOn: invitation.starts_on, endsOn: invitation.ends_on })}</Text>
              <View style={styles.actions}>
                <InvitationAction disabled={isMutating} label={t('invitations.accept')} onPress={() => void respond(invitation, 'accepted')} primary />
                <InvitationAction disabled={isMutating} label={t('invitations.decline')} onPress={() => void respond(invitation, 'declined')} />
              </View>
            </View>
          ))
        )}
        {errorCode ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>{t(`errors.${errorCode}`)}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InvitationAction({ disabled, label, onPress, primary = false }: { disabled: boolean; label: string; onPress: () => void; primary?: boolean }) {
  const { theme } = useTheme();

  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, { backgroundColor: primary ? theme.colors.primary : theme.colors.background, borderColor: primary ? theme.colors.primary : theme.colors.border, opacity: pressed || disabled ? 0.72 : 1 }]}>
      <Text style={[styles.actionLabel, { color: primary ? theme.colors.onPrimary : theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  actionLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  actions: { flexDirection: 'row', gap: spacing.sm },
  backButton: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backLabel: { fontSize: typography.size.body, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.body },
  card: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  content: { gap: spacing.md, padding: spacing.md },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  empty: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  error: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  meta: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  screen: { flex: 1 },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
});
