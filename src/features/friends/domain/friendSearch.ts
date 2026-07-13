export const publicCodePattern = /^[A-Za-z0-9]{12}$/;

export type FriendSearchErrorCode =
  | 'FRIEND_CODE_RATE_LIMITED'
  | 'FRIEND_SEARCH_FAILED'
  | 'INVALID_PUBLIC_CODE';

export class FriendSearchDomainError extends Error {
  constructor(public readonly code: FriendSearchErrorCode) {
    super(code);
    this.name = 'FriendSearchDomainError';
  }
}

export function isPublicCode(value: string): boolean {
  return publicCodePattern.test(value);
}

export function getFriendSearchErrorCode(error: unknown): FriendSearchErrorCode {
  return error instanceof FriendSearchDomainError
    ? error.code
    : 'FRIEND_SEARCH_FAILED';
}
