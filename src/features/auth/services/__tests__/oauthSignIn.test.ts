import {
  exchangeOAuthCallbackCode,
  getOAuthRedirectUrl,
  parseOAuthCallbackCode,
} from '@/features/auth/services/oauthSignIn';

describe('OAuth callback parsing', () => {
  it('uses the active Expo runtime when creating the callback URL', () => {
    expect(
      getOAuthRedirectUrl(
        (path) => `exp://192.0.2.1:8081/--/${path}`,
      ),
    ).toBe('exp://192.0.2.1:8081/--/auth/callback');
  });

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

  it('exchanges the PKCE code once without exposing it to the UI', async () => {
    const exchangeCodeForSession = jest.fn().mockResolvedValue({ error: null });

    await exchangeOAuthCallbackCode('authorization-code', {
      auth: { exchangeCodeForSession },
    });

    expect(exchangeCodeForSession).toHaveBeenCalledWith('authorization-code');
  });
});
