import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { AuthDomainError } from '@/features/auth/domain/authErrors';
import { supabaseClient } from '@/lib/supabase/client';

WebBrowser.maybeCompleteAuthSession();

const OAUTH_CALLBACK_PATH = 'auth/callback';

type CreateUrl = (path: string) => string;

export function getOAuthRedirectUrl(
  createUrl: CreateUrl = Linking.createURL,
): string {
  return createUrl(OAUTH_CALLBACK_PATH);
}

export function parseOAuthCallbackCode(url: string): string | null {
  const parsedUrl = new URL(url);

  return parsedUrl.searchParams.get('code');
}

export async function signInWithGoogle(): Promise<'success' | 'cancelled'> {
  if (!supabaseClient) {
    throw new AuthDomainError('AUTH_CONFIGURATION_MISSING');
  }

  const redirectUrl = getOAuthRedirectUrl();

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'consent' },
    },
  });

  if (error || !data.url) {
    throw new AuthDomainError('AUTH_PROVIDER_FAILED');
  }

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectUrl,
  );

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return 'cancelled';
  }

  if (result.type !== 'success') {
    throw new AuthDomainError('AUTH_PROVIDER_FAILED');
  }

  const code = parseOAuthCallbackCode(result.url);

  if (!code) {
    throw new AuthDomainError('AUTH_TOKEN_MISSING');
  }

  const { error: sessionError } =
    await supabaseClient.auth.exchangeCodeForSession(code);

  if (sessionError) {
    throw new AuthDomainError('AUTH_PROVIDER_FAILED');
  }

  return 'success';
}
