export type AuthErrorCode =
  | 'AUTH_CONFIGURATION_MISSING'
  | 'AUTH_PROVIDER_CANCELLED'
  | 'AUTH_PROVIDER_FAILED'
  | 'AUTH_TOKEN_MISSING'
  | 'AUTH_PROFILE_UNAVAILABLE';

export class AuthDomainError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(code);
    this.name = 'AuthDomainError';
  }
}

export function getAuthErrorCode(error: unknown): AuthErrorCode {
  return error instanceof AuthDomainError
    ? error.code
    : 'AUTH_PROVIDER_FAILED';
}
