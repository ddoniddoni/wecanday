import '@/i18n';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
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
        </Stack.Protected>
        <Stack.Protected guard={auth.status === 'signed_in'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
