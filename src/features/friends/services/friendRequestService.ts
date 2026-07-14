import type { SupabaseClient } from '@supabase/supabase-js';

import {
  FriendRequestDomainError,
} from '@/features/friends/domain/friendRequests';
import {
  SocialMutationError,
  invokeSocialMutation,
} from '@/features/notifications/services/socialMutationService';
import type {
  Database,
  FriendshipRow,
  PendingFriendRequestRow,
} from '@/lib/supabase/database.types';

export async function createFriendRequest(
  client: SupabaseClient<Database>,
  recipientId: string,
): Promise<FriendshipRow> {
  try {
    return await invokeSocialMutation<FriendshipRow>(client, {
      action: 'create_friend_request',
      recipientId,
    });
  } catch (error) {
    throw mapFriendRequestError(
      error instanceof SocialMutationError ? error.code : undefined,
    );
  }
}

export async function loadPendingFriendRequests(
  client: SupabaseClient<Database>,
): Promise<PendingFriendRequestRow[]> {
  const { data, error } = await client.rpc('list_pending_friend_requests');

  if (!error && data) {
    return data;
  }

  throw mapFriendRequestError(error?.message);
}

export async function respondToFriendRequest(
  client: SupabaseClient<Database>,
  friendshipId: string,
  response: 'accepted' | 'declined',
): Promise<void> {
  const { error } = await client.rpc('respond_to_friend_request', {
    p_friendship_id: friendshipId,
    p_response: response,
  });

  if (error) {
    throw mapFriendRequestError(error.message);
  }
}

export async function cancelFriendRequest(
  client: SupabaseClient<Database>,
  friendshipId: string,
): Promise<void> {
  const { error } = await client.rpc('cancel_friend_request', {
    p_friendship_id: friendshipId,
  });

  if (error) {
    throw mapFriendRequestError(error.message);
  }
}

function mapFriendRequestError(message: string | undefined): FriendRequestDomainError {
  if (message?.includes('CANNOT_REQUEST_SELF')) {
    return new FriendRequestDomainError('CANNOT_REQUEST_SELF');
  }

  if (message?.includes('FRIEND_REQUEST_NOT_FOUND')) {
    return new FriendRequestDomainError('FRIEND_REQUEST_NOT_FOUND');
  }

  if (message?.includes('USER_BLOCKED')) {
    return new FriendRequestDomainError('USER_BLOCKED');
  }

  return new FriendRequestDomainError('FRIEND_REQUEST_FAILED');
}
