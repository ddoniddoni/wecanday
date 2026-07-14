import { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { OAuthCallbackScreen } from '@/features/auth/OAuthCallbackScreen';

export default function OAuthCallbackRoute() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string | string[] }>();
  const returnToSignIn = useCallback(() => {
    router.replace('/');
  }, [router]);

  return (
    <OAuthCallbackScreen
      code={typeof code === 'string' ? code : null}
      onReturnToSignIn={returnToSignIn}
    />
  );
}
