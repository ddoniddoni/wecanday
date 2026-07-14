import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AccountSettingsScreen } from '@/features/auth/AccountSettingsScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('AccountSettingsScreen', () => {
  it('requires a separate permanent-deletion confirmation', async () => {
    await i18n.changeLanguage('en');
    const onDeleteAccount = jest.fn(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <AccountSettingsScreen
          onBack={jest.fn()}
          onDeleteAccount={onDeleteAccount}
          onSignOut={jest.fn(() => Promise.resolve())}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));

    expect(screen.getByText('Delete your account permanently?')).toBeTruthy();
    expect(onDeleteAccount).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Permanently delete' }));

    await waitFor(() => {
      expect(onDeleteAccount).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps account deletion available when sign-out fails', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <AccountSettingsScreen
          onBack={jest.fn()}
          onDeleteAccount={jest.fn(() => Promise.resolve())}
          onSignOut={jest.fn(() => Promise.reject(new Error('SIGN_OUT_FAILED')))}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(screen.getByText("We couldn't sign you out. Please try again.")).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeTruthy();
  });
});
