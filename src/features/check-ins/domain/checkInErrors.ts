export type CheckInErrorCode =
  | 'CHECK_IN_FAILED'
  | 'CHECK_IN_WINDOW_CLOSED'
  | 'INVALID_ROUTINE_DAY'
  | 'ROUTINE_NOT_SCHEDULED'
  | 'ROUTINE_DAY_SETTINGS_REQUIRED';

export class CheckInDomainError extends Error {
  constructor(public readonly code: CheckInErrorCode) {
    super(code);
    this.name = 'CheckInDomainError';
  }
}

export function getCheckInErrorCode(error: unknown): CheckInErrorCode {
  return error instanceof CheckInDomainError ? error.code : 'CHECK_IN_FAILED';
}
