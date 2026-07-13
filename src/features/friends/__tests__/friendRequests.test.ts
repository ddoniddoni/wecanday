import {
  FriendRequestDomainError,
  getFriendRequestErrorCode,
} from '@/features/friends/domain/friendRequests';

describe('friend request errors', () => {
  it('preserves the blocked-user error for a translated UI response', () => {
    expect(
      getFriendRequestErrorCode(new FriendRequestDomainError('USER_BLOCKED')),
    ).toBe('USER_BLOCKED');
  });

  it('uses a safe generic error for unexpected failures', () => {
    expect(getFriendRequestErrorCode(new Error('network'))).toBe('FRIEND_REQUEST_FAILED');
  });
});
