import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { AuthDomainError } from '@/features/auth/domain/authErrors';
import { signInWithOAuthProvider } from '@/features/auth/services/oauthSignIn';
import { supabaseClient } from '@/lib/supabase/client';

function isCancelledAppleRequest(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_REQUEST_CANCELED'
  );
}

function getAppleDisplayName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | null {
  if (!fullName) {
    return null;
  }

  const displayName = [fullName.givenName, fullName.familyName]
    .filter((name): name is string => Boolean(name))
    .join(' ')
    .trim();

  return displayName ? displayName.slice(0, 30) : null;
}

export async function signInWithApple(): Promise<'success' | 'cancelled'> {
  if (Platform.OS !== 'ios') {
    return signInWithOAuthProvider('apple');
  }

  if (!supabaseClient) {
    throw new AuthDomainError('AUTH_CONFIGURATION_MISSING');
  }

  try {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );
    const credential = await AppleAuthentication.signInAsync({
      nonce: hashedNonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new AuthDomainError('AUTH_TOKEN_MISSING');
    }

    const { data, error } = await supabaseClient.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
      access_token: credential.authorizationCode ?? undefined,
    });

    if (error || !data.user) {
      throw new AuthDomainError('AUTH_PROVIDER_FAILED');
    }

    const displayName = getAppleDisplayName(credential.fullName);

    if (displayName) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', data.user.id);

      if (profileError) {
        throw new AuthDomainError('AUTH_PROFILE_UNAVAILABLE');
      }
    }

    return 'success';
  } catch (error) {
    if (isCancelledAppleRequest(error)) {
      return 'cancelled';
    }

    throw error instanceof AuthDomainError
      ? error
      : new AuthDomainError('AUTH_PROVIDER_FAILED');
  }
}
