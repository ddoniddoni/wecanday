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
  getFriendRequestErrorCode,
  type FriendRequestErrorCode,
} from '@/features/friends/domain/friendRequests';
import {
  cancelFriendRequest,
  loadPendingFriendRequests,
  respondToFriendRequest,
} from '@/features/friends/services/friendRequestService';
import type { Database, PendingFriendRequestRow } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type FriendRequestsScreenProps = {
  client: SupabaseClient<Database>;
  onBack: () => void;
};

export function FriendRequestsScreen({ client, onBack }: FriendRequestsScreenProps) {
  const { t } = useTranslation('friends');
  const { theme } = useTheme();
  const [requests, setRequests] = useState<PendingFriendRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorCode, setErrorCode] = useState<FriendRequestErrorCode | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorCode(null);
    try {
      setRequests(await loadPendingFriendRequests(client));
    } catch (error) {
      setErrorCode(getFriendRequestErrorCode(error));
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

  async function mutateRequest(
    request: PendingFriendRequestRow,
    action: 'accept' | 'cancel' | 'decline',
  ) {
    setIsMutating(true);
    setErrorCode(null);
    try {
      if (action === 'cancel') {
        await cancelFriendRequest(client, request.id);
      } else {
        await respondToFriendRequest(
          client,
          request.id,
          action === 'accept' ? 'accepted' : 'declined',
        );
      }
      await refresh();
    } catch (error) {
      setErrorCode(getFriendRequestErrorCode(error));
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel={t('requests.back')}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>{t('requests.back')}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t('requests.title')}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t('requests.description')}
        </Text>
        {isLoading ? (
          <ActivityIndicator accessibilityLabel={t('requests.loading')} color={theme.colors.primary} />
        ) : requests.length === 0 && !errorCode ? (
          <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{t('requests.empty')}</Text>
        ) : (
          requests.map((request) => (
            <View
              key={request.id}
              style={[styles.request, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <Text style={[styles.requestName, { color: theme.colors.text }]}>{request.display_name}</Text>
              <Text style={[styles.requestMeta, { color: theme.colors.textMuted }]}>
                {t(`requests.direction.${request.direction}`, { seed: request.avatar_seed })}
              </Text>
              <View style={styles.actions}>
                {request.direction === 'incoming' ? (
                  <>
                    <RequestAction
                      disabled={isMutating}
                      label={t('requests.accept')}
                      onPress={() => void mutateRequest(request, 'accept')}
                      primary
                    />
                    <RequestAction
                      disabled={isMutating}
                      label={t('requests.decline')}
                      onPress={() => void mutateRequest(request, 'decline')}
                    />
                  </>
                ) : (
                  <RequestAction
                    disabled={isMutating}
                    label={t('requests.cancel')}
                    onPress={() => void mutateRequest(request, 'cancel')}
                  />
                )}
              </View>
            </View>
          ))
        )}
        {errorCode ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
            {t(`requests.errors.${errorCode}`)}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestAction({
  disabled,
  label,
  onPress,
  primary = false,
}: {
  disabled: boolean;
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
      <Text style={[styles.actionLabel, { color: primary ? theme.colors.onPrimary : theme.colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  actionLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  actions: { flexDirection: 'row', gap: spacing.sm },
  backButton: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backLabel: { fontSize: typography.size.body, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.body },
  content: { gap: spacing.md, padding: spacing.md },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  empty: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  error: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  request: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  requestMeta: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  requestName: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  screen: { flex: 1 },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
});
