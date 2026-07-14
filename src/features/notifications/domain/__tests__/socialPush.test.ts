import { getSocialNotificationTarget } from '@/features/notifications/domain/socialPush';

describe('social push target', () => {
  it('opens friend requests only for a valid friend request payload', () => {
    expect(getSocialNotificationTarget({
      entityId: 'friendship-1',
      route: 'friend-requests',
      type: 'friend_request',
    })).toEqual({ entityId: 'friendship-1', screen: 'friend-requests' });
  });

  it('opens challenge invitations only for a valid challenge payload', () => {
    expect(getSocialNotificationTarget({
      entityId: 'challenge-1',
      route: 'challenge-invitations',
      type: 'challenge_invitation',
    })).toEqual({ entityId: 'challenge-1', screen: 'challenge-invitations' });
  });

  it('does not route malformed or unknown notification data', () => {
    expect(getSocialNotificationTarget({ type: 'friend_request' })).toBeNull();
    expect(getSocialNotificationTarget({
      entityId: 'challenge-1',
      route: 'friend-requests',
      type: 'challenge_invitation',
    })).toBeNull();
  });
});
