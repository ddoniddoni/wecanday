import { render } from '@testing-library/react-native';

import { LoginScreen } from '@/features/auth/LoginScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('LoginScreen', () => {
  it('offers Google as the only initial-release sign-in provider', async () => {
    await i18n.changeLanguage('en');

    const screen = await render(
      <ThemeProvider preference="light">
        <LoginScreen />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Log in or create profile' })).toBeTruthy();
    expect(screen.getByTestId('google-sign-in-logo')).toBeTruthy();
    expect(screen.queryByText('Continue with Apple')).toBeNull();
  });
});
