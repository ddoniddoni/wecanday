import type { Provider } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

import { AuthDomainError } from '@/features/auth/domain/authErrors';
import { supabaseClient } from '@/lib/supabase/client';

WebBrowser.maybeCompleteAuthSession();

const OAUTH_REDIRECT_URL = 'wecanday://auth/callback';

export function parseOAuthCallbackCode(url: string): string | null {
  const parsedUrl = new URL(url);

  return parsedUrl.searchParams.get('code');
}

export async function signInWithOAuthProvider(
  provider: Extract<Provider, 'apple' | 'google'>,
): Promise<'success' | 'cancelled'> {
  if (!supabaseClient) {
    throw new AuthDomainError('AUTH_CONFIGURATION_MISSING');
  }

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: OAUTH_REDIRECT_URL,
      skipBrowserRedirect: true,
      queryParams: provider === 'google' ? { prompt: 'consent' } : undefined,
    },
  });

  if (error || !data.url) {
    throw new AuthDomainError('AUTH_PROVIDER_FAILED');
  }

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    OAUTH_REDIRECT_URL,
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
