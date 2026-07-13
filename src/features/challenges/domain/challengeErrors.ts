export type ChallengeErrorCode =
  | 'CHALLENGE_CREATE_FAILED'
  | 'CHALLENGE_INVITATION_NOT_FOUND'
  | 'CHALLENGE_LOAD_FAILED'
  | 'INVALID_CHALLENGE_INPUT'
  | 'INVALID_CHALLENGE_RESPONSE'
  | 'ROUTINE_LIMIT_REACHED'
  | 'USER_BLOCKED';

export class ChallengeDomainError extends Error {
  constructor(public readonly code: ChallengeErrorCode) {
    super(code);
    this.name = 'ChallengeDomainError';
  }
}

export function getChallengeErrorCode(error: unknown): ChallengeErrorCode {
  return error instanceof ChallengeDomainError
    ? error.code
    : 'CHALLENGE_CREATE_FAILED';
}
