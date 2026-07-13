import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getFriendConnectionErrorCode,
  type FriendConnectionErrorCode,
} from '@/features/friends/domain/friendConnections';
import {
  blockUser,
  loadFriendConnections,
  removeFriend,
  unblockUser,
} from '@/features/friends/services/friendConnectionService';
import type { Database, FriendConnectionRow } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type FriendConnectionsScreenProps = {
  client: SupabaseClient<Database>;
  onBack: () => void;
  onCreateChallenge: () => void;
  onOpenChallengeInvitations: () => void;
};

export function FriendConnectionsScreen({
  client,
  onBack,
  onCreateChallenge,
  onOpenChallengeInvitations,
}: FriendConnectionsScreenProps) {
  const { t } = useTranslation('friends');
  const { theme } = useTheme();
  const [friends, setFriends] = useState<FriendConnectionRow[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<FriendConnectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorCode, setErrorCode] = useState<FriendConnectionErrorCode | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorCode(null);
    try {
      const connections = await loadFriendConnections(client);

      setFriends(connections.friends);
      setBlockedUsers(connections.blockedUsers);
    } catch (error) {
      setErrorCode(getFriendConnectionErrorCode(error));
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

  async function mutate(
    target: FriendConnectionRow,
    action: 'block' | 'remove' | 'unblock',
  ) {
    setIsMutating(true);
    setErrorCode(null);
    try {
      if (action === 'block') {
        await blockUser(client, target.id);
      } else if (action === 'remove') {
        await removeFriend(client, target.id);
      } else {
        await unblockUser(client, target.id);
      }
      await refresh();
    } catch (error) {
      setErrorCode(getFriendConnectionErrorCode(error));
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel={t('connections.back')}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>{t('connections.back')}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t('connections.title')}
        </Text>
        <View style={styles.challengeActions}>
          <ConnectionAction label={t('connections.createChallenge')} onPress={onCreateChallenge} />
          <ConnectionAction label={t('connections.openChallengeInvitations')} onPress={onOpenChallengeInvitations} />
        </View>
        {isLoading ? (
          <ActivityIndicator accessibilityLabel={t('connections.loading')} color={theme.colors.primary} />
        ) : (
          <>
            <ConnectionSection
              emptyLabel={t('connections.emptyFriends')}
              friends={friends}
              heading={t('connections.friendsHeading')}
              isMutating={isMutating}
              onBlock={(friend) => void mutate(friend, 'block')}
              onRemove={(friend) => void mutate(friend, 'remove')}
              variant="friends"
            />
            <ConnectionSection
              emptyLabel={t('connections.emptyBlocked')}
              friends={blockedUsers}
              heading={t('connections.blockedHeading')}
              isMutating={isMutating}
              onUnblock={(friend) => void mutate(friend, 'unblock')}
              variant="blocked"
            />
          </>
        )}
        {errorCode ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
            {t(`connections.errors.${errorCode}`)}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectionSection({
  emptyLabel,
  friends,
  heading,
  isMutating,
  onBlock,
  onRemove,
  onUnblock,
  variant,
}: {
  emptyLabel: string;
  friends: FriendConnectionRow[];
  heading: string;
  isMutating: boolean;
  onBlock?: (friend: FriendConnectionRow) => void;
  onRemove?: (friend: FriendConnectionRow) => void;
  onUnblock?: (friend: FriendConnectionRow) => void;
  variant: 'blocked' | 'friends';
}) {
  const { t } = useTranslation('friends');
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.heading, { color: theme.colors.text }]}>{heading}</Text>
      {friends.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{emptyLabel}</Text>
      ) : (
        friends.map((friend) => (
          <View key={friend.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{friend.display_name}</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{t('connections.avatarPreview', { seed: friend.avatar_seed })}</Text>
            <View style={styles.actions}>
              {variant === 'friends' ? (
                <>
                  <ConnectionAction disabled={isMutating} label={t('connections.remove')} onPress={() => onRemove?.(friend)} />
                  <ConnectionAction disabled={isMutating} label={t('connections.block')} onPress={() => onBlock?.(friend)} primary />
                </>
              ) : (
                <ConnectionAction disabled={isMutating} label={t('connections.unblock')} onPress={() => onUnblock?.(friend)} />
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function ConnectionAction({
  disabled = false,
  label,
  onPress,
  primary = false,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: primary ? theme.colors.primary : theme.colors.background,
          borderColor: primary ? theme.colors.primary : theme.colors.border,
          opacity: pressed || disabled ? 0.72 : 1,
        },
      ]}
    >
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
  challengeActions: { flexDirection: 'row', gap: spacing.sm },
  content: { gap: spacing.md, padding: spacing.md },
  empty: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  error: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  heading: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  meta: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  name: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  screen: { flex: 1 },
  section: { gap: spacing.sm },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
});
