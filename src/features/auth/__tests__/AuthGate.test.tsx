import { render } from '@testing-library/react-native';

import { AuthGate } from '@/features/auth/AuthGate';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('AuthGate', () => {
  it('shows a recoverable configuration state without exposing secrets', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <AuthProvider client={null}>
          <AuthGate />
        </AuthProvider>
      </ThemeProvider>,
    );

    expect(screen.getByText('Connect Supabase to continue')).toBeTruthy();
    expect(
      screen.queryByText(/service.role|secret|access.token/i),
    ).toBeNull();
  });
});
