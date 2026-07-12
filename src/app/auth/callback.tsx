import { useLocalSearchParams, useRouter } from 'expo-router';

import { OAuthCallbackScreen } from '@/features/auth/OAuthCallbackScreen';

export default function OAuthCallbackRoute() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string | string[] }>();

  return (
    <OAuthCallbackScreen
      code={typeof code === 'string' ? code : null}
      onComplete={() => router.replace('/')}
      onReturnToSignIn={() => router.replace('/')}
    />
  );
}
