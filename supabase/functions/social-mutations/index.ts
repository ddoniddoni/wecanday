import '@supabase/functions-js/edge-runtime.d.ts';

import { withSupabase } from '@supabase/server';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const SOCIAL_UPDATES_CHANNEL_ID = 'social-updates';

type SocialMutationRequest =
  | { action: 'create_friend_request'; recipientId: string }
  | {
      action: 'create_one_to_one_challenge';
      endsOn: string;
      friendId: string;
      scheduleWeekdays: number[];
      startsOn: string;
      title: string;
    };

type Friendship = {
  addressee_id: string;
  id: string;
  requester_id: string;
  status: string;
};

type Challenge = {
  id: string;
  status: string;
};

type DevicePushToken = {
  expo_push_token: string;
  id: string;
  locale: string;
};

type ExpoPushTicket = {
  details?: { error?: string };
  status?: string;
};

type SocialPush = {
  entityId: string;
  route: 'challenge-invitations' | 'friend-requests';
  type: 'challenge_invitation' | 'friend_request';
};

const errorCodes = [
  'CANNOT_REQUEST_SELF',
  'CHALLENGE_INVITATION_NOT_FOUND',
  'FRIEND_REQUEST_NOT_FOUND',
  'INVALID_CHALLENGE_RESPONSE',
  'ROUTINE_LIMIT_REACHED',
  'USER_BLOCKED',
] as const;

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, context) => {
    const mutationRequest = await parseMutationRequest(request);

    if (!mutationRequest) {
      return Response.json({ errorCode: 'SOCIAL_MUTATION_FAILED' }, { status: 400 });
    }

    if (mutationRequest.action === 'create_friend_request') {
      const { data, error } = await context.supabase.rpc('create_friend_request', {
        p_recipient_id: mutationRequest.recipientId,
      });

      if (error || !isFriendship(data)) {
        return Response.json({ errorCode: getDatabaseErrorCode(error?.message) });
      }

      if (data.status === 'pending' && data.addressee_id === mutationRequest.recipientId) {
        await sendSocialPush(context.supabaseAdmin, data.addressee_id, {
          entityId: data.id,
          route: 'friend-requests',
          type: 'friend_request',
        });
      }

      return Response.json({ data });
    }

    const { data, error } = await context.supabase.rpc('create_one_to_one_challenge', {
      p_ends_on: mutationRequest.endsOn,
      p_friend_id: mutationRequest.friendId,
      p_schedule_weekdays: mutationRequest.scheduleWeekdays,
      p_starts_on: mutationRequest.startsOn,
      p_title: mutationRequest.title,
    });

    if (error || !isChallenge(data)) {
      return Response.json({ errorCode: getDatabaseErrorCode(error?.message) });
    }

    if (data.status === 'invited') {
      await sendSocialPush(context.supabaseAdmin, mutationRequest.friendId, {
        entityId: data.id,
        route: 'challenge-invitations',
        type: 'challenge_invitation',
      });
    }

    return Response.json({ data });
  }),
};

async function parseMutationRequest(request: Request): Promise<SocialMutationRequest | null> {
  try {
    const value: unknown = await request.json();

    if (!isRecord(value) || typeof value.action !== 'string') {
      return null;
    }

    if (value.action === 'create_friend_request' && typeof value.recipientId === 'string') {
      return { action: value.action, recipientId: value.recipientId };
    }

    if (
      value.action === 'create_one_to_one_challenge' &&
      typeof value.endsOn === 'string' &&
      typeof value.friendId === 'string' &&
      typeof value.startsOn === 'string' &&
      typeof value.title === 'string' &&
      Array.isArray(value.scheduleWeekdays) &&
      value.scheduleWeekdays.every((weekday) => (
        typeof weekday === 'number' && Number.isInteger(weekday)
      ))
    ) {
      return {
        action: value.action,
        endsOn: value.endsOn,
        friendId: value.friendId,
        scheduleWeekdays: value.scheduleWeekdays as number[],
        startsOn: value.startsOn,
        title: value.title,
      };
    }
  } catch {
    return null;
  }

  return null;
}

async function sendSocialPush(
  adminClient: SupabaseClient,
  recipientId: string,
  push: SocialPush,
): Promise<void> {
  const { data, error } = await adminClient
    .from('device_push_tokens')
    .select('expo_push_token, id, locale')
    .eq('enabled', true)
    .eq('user_id', recipientId);

  if (error || !Array.isArray(data)) {
    return;
  }

  const tokens = data.filter(isDevicePushToken);

  if (tokens.length === 0) {
    return;
  }

  try {
    const response = await fetch(EXPO_PUSH_SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens.map((token) => ({
        to: token.expo_push_token,
        sound: 'default',
        channelId: SOCIAL_UPDATES_CHANNEL_ID,
        data: push,
        ...getNotificationCopy(push.type, token.locale),
      }))),
    });

    if (!response.ok) {
      return;
    }

    const payload: unknown = await response.json();
    const invalidTokenIds = getInvalidTokenIds(payload, tokens);

    if (invalidTokenIds.length > 0) {
      await adminClient
        .from('device_push_tokens')
        .update({ enabled: false })
        .in('id', invalidTokenIds);
    }
  } catch {
    // Push delivery is best effort and must not roll back the social action.
  }
}

function getNotificationCopy(
  type: SocialPush['type'],
  locale: string,
): { body: string; title: string } {
  const isKorean = locale.toLowerCase().startsWith('ko');

  if (type === 'friend_request') {
    return isKorean
      ? { body: '친구 요청이 도착했어요.', title: '새 친구 요청' }
      : { body: 'You have a new friend request.', title: 'New friend request' };
  }

  return isKorean
    ? { body: '챌린지 초대가 도착했어요.', title: '새 챌린지 초대' }
    : { body: 'You have a new challenge invitation.', title: 'New challenge invitation' };
}

function getInvalidTokenIds(payload: unknown, tokens: DevicePushToken[]): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    return [];
  }

  return payload.data.flatMap((ticket, index) => (
    isExpoDeviceNotRegisteredTicket(ticket) && tokens[index] ? [tokens[index].id] : []
  ));
}

function getDatabaseErrorCode(message: string | undefined): string {
  return errorCodes.find((code) => message?.includes(code)) ?? 'SOCIAL_MUTATION_FAILED';
}

function isChallenge(value: unknown): value is Challenge {
  return isRecord(value) && typeof value.id === 'string' && typeof value.status === 'string';
}

function isDevicePushToken(value: unknown): value is DevicePushToken {
  return isRecord(value) &&
    typeof value.expo_push_token === 'string' &&
    typeof value.id === 'string' &&
    typeof value.locale === 'string';
}

function isExpoDeviceNotRegisteredTicket(value: unknown): value is ExpoPushTicket {
  return isRecord(value) &&
    isRecord(value.details) &&
    value.details.error === 'DeviceNotRegistered';
}

function isFriendship(value: unknown): value is Friendship {
  return isRecord(value) &&
    typeof value.addressee_id === 'string' &&
    typeof value.id === 'string' &&
    typeof value.requester_id === 'string' &&
    typeof value.status === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
