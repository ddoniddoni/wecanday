export type SocialNotificationTarget = {
  entityId: string;
  screen: 'challenge-invitations' | 'friend-requests';
};

export function getSocialNotificationTarget(
  data: unknown,
): SocialNotificationTarget | null {
  if (!isRecord(data) || typeof data.entityId !== 'string') {
    return null;
  }

  if (data.type === 'friend_request' && data.route === 'friend-requests') {
    return { entityId: data.entityId, screen: 'friend-requests' };
  }

  if (
    data.type === 'challenge_invitation' &&
    data.route === 'challenge-invitations'
  ) {
    return { entityId: data.entityId, screen: 'challenge-invitations' };
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
