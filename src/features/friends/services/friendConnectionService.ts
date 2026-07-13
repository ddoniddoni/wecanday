import type { SupabaseClient } from '@supabase/supabase-js';

import {
  FriendConnectionDomainError,
} from '@/features/friends/domain/friendConnections';
import type { Database, FriendConnectionRow } from '@/lib/supabase/database.types';

export async function loadFriendConnections(
  client: SupabaseClient<Database>,
): Promise<{ blockedUsers: FriendConnectionRow[]; friends: FriendConnectionRow[] }> {
  const [blockedResult, friendsResult] = await Promise.all([
    client.rpc('list_blocked_users'),
    client.rpc('list_friends'),
  ]);

  if (blockedResult.error || friendsResult.error || !blockedResult.data || !friendsResult.data) {
    throw mapFriendConnectionError(blockedResult.error?.message ?? friendsResult.error?.message);
  }

  return { blockedUsers: blockedResult.data, friends: friendsResult.data };
}

export async function removeFriend(
  client: SupabaseClient<Database>,
  friendId: string,
): Promise<void> {
  const { error } = await client.rpc('remove_friend', { p_friend_id: friendId });

  if (error) {
    throw mapFriendConnectionError(error.message);
  }
}

export async function blockUser(
  client: SupabaseClient<Database>,
  targetUserId: string,
): Promise<void> {
  const { error } = await client.rpc('block_user', { p_target_user_id: targetUserId });

  if (error) {
    throw mapFriendConnectionError(error.message);
  }
}

export async function unblockUser(
  client: SupabaseClient<Database>,
  targetUserId: string,
): Promise<void> {
  const { error } = await client.rpc('unblock_user', { p_target_user_id: targetUserId });

  if (error) {
    throw mapFriendConnectionError(error.message);
  }
}

function mapFriendConnectionError(message: string | undefined): FriendConnectionDomainError {
  if (message?.includes('BLOCK_NOT_FOUND')) {
    return new FriendConnectionDomainError('BLOCK_NOT_FOUND');
  }

  if (message?.includes('CANNOT_BLOCK_SELF')) {
    return new FriendConnectionDomainError('CANNOT_BLOCK_SELF');
  }

  if (message?.includes('FRIEND_NOT_FOUND')) {
    return new FriendConnectionDomainError('FRIEND_NOT_FOUND');
  }

  return new FriendConnectionDomainError('FRIEND_CONNECTION_FAILED');
}
