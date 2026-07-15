import '@/i18n';

import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { isCompanionId } from '@/features/companion/domain/companions';
import { configureNotificationPresentation } from '@/features/notifications/services/notificationPresentationService';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

configureNotificationPresentation();

function RootNavigator() {
  const auth = useAuth();
  const { theme } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerShown: false,
        }}
      >
        <Stack.Protected guard={auth.status !== 'signed_in'}>
          <Stack.Screen name="index" />
          <Stack.Protected
            guard={auth.status === 'loading' || auth.status === 'signed_out'}
          >
            <Stack.Screen name="auth/callback" />
          </Stack.Protected>
        </Stack.Protected>
        <Stack.Protected guard={auth.status === 'signed_in'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}

function AuthenticatedThemeProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const companionId = auth.status === 'signed_in' && isCompanionId(auth.profile.companion_id)
    ? auth.profile.companion_id
    : undefined;

  return <ThemeProvider companionId={companionId}>{children}</ThemeProvider>;
}

export default function RootLayout() {
  const [areFontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!areFontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AuthenticatedThemeProvider>
        <RootNavigator />
      </AuthenticatedThemeProvider>
    </AuthProvider>
  );
}
