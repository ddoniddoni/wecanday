export type FriendRequestErrorCode =
  | 'CANNOT_REQUEST_SELF'
  | 'FRIEND_REQUEST_FAILED'
  | 'FRIEND_REQUEST_NOT_FOUND'
  | 'USER_BLOCKED';

export class FriendRequestDomainError extends Error {
  constructor(public readonly code: FriendRequestErrorCode) {
    super(code);
    this.name = 'FriendRequestDomainError';
  }
}

export function getFriendRequestErrorCode(error: unknown): FriendRequestErrorCode {
  return error instanceof FriendRequestDomainError
    ? error.code
    : 'FRIEND_REQUEST_FAILED';
}
