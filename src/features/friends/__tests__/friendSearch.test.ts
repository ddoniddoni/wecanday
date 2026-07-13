import {
  FriendSearchDomainError,
  getFriendSearchErrorCode,
  isPublicCode,
} from '@/features/friends/domain/friendSearch';

describe('friend code search validation', () => {
  it.each(['Ab7kL2xP9Qm4', '000000000000', 'aBcD1234EfGh']) (
    'accepts a complete Base62 code: %s',
    (code) => {
      expect(isPublicCode(code)).toBe(true);
    },
  );

  it.each(['Ab7kL2xP9Qm', 'Ab7kL2xP9Qm!', 'Ab7kL2xP9Qm4 ', 'Ab7kL2xP9qM4\n']) (
    'rejects anything other than an exact 12-character code: %s',
    (code) => {
      expect(isPublicCode(code)).toBe(false);
    },
  );

  it('keeps rate-limit failures distinct from generic failures', () => {
    expect(
      getFriendSearchErrorCode(
        new FriendSearchDomainError('FRIEND_CODE_RATE_LIMITED'),
      ),
    ).toBe('FRIEND_CODE_RATE_LIMITED');
    expect(getFriendSearchErrorCode(new Error('network'))).toBe('FRIEND_SEARCH_FAILED');
  });
});
