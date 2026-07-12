import { parseOAuthCallbackCode } from '@/features/auth/services/oauthSignIn';

describe('OAuth callback parsing', () => {
  it('extracts the PKCE authorization code without handling raw tokens', () => {
    expect(
      parseOAuthCallbackCode('wecanday://auth/callback?code=authorization-code'),
    ).toBe('authorization-code');
  });

  it('rejects incomplete callbacks', () => {
    expect(
      parseOAuthCallbackCode('wecanday://auth/callback?error=access_denied'),
    ).toBeNull();
  });
});
