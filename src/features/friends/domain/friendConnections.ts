export type FriendConnectionErrorCode =
  | 'BLOCK_NOT_FOUND'
  | 'CANNOT_BLOCK_SELF'
  | 'FRIEND_CONNECTION_FAILED'
  | 'FRIEND_NOT_FOUND';

export class FriendConnectionDomainError extends Error {
  constructor(public readonly code: FriendConnectionErrorCode) {
    super(code);
    this.name = 'FriendConnectionDomainError';
  }
}

export function getFriendConnectionErrorCode(
  error: unknown,
): FriendConnectionErrorCode {
  return error instanceof FriendConnectionDomainError
    ? error.code
    : 'FRIEND_CONNECTION_FAILED';
}
