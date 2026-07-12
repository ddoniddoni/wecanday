import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthDomainError } from '@/features/auth/domain/authErrors';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

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

type OAuthClient = {
  auth: Pick<SupabaseClient<Database>['auth'], 'exchangeCodeForSession'>;
};

export async function exchangeOAuthCallbackCode(
  code: string,
  client: OAuthClient | null = supabaseClient,
): Promise<void> {
  if (!client) {
    throw new AuthDomainError('AUTH_CONFIGURATION_MISSING');
  }

  const { error } = await client.auth.exchangeCodeForSession(code);

  if (error) {
    throw new AuthDomainError('AUTH_PROVIDER_FAILED');
  }
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

  // Expo Router opens the callback route on Android. That route exchanges the
  // PKCE code exactly once, avoiding a duplicate exchange after the browser
  // returns to the app.
  return 'success';
}
