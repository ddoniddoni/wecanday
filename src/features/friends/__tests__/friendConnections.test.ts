import {
  FriendConnectionDomainError,
  getFriendConnectionErrorCode,
} from '@/features/friends/domain/friendConnections';

describe('friend connection errors', () => {
  it('preserves a missing block error for the UI', () => {
    expect(
      getFriendConnectionErrorCode(new FriendConnectionDomainError('BLOCK_NOT_FOUND')),
    ).toBe('BLOCK_NOT_FOUND');
  });

  it('uses a safe generic error for unknown failures', () => {
    expect(getFriendConnectionErrorCode(new Error('network'))).toBe(
      'FRIEND_CONNECTION_FAILED',
    );
  });
});
