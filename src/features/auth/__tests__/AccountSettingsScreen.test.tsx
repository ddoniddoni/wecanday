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
          displayName="Mina"
          hapticsEnabled
          reduceMotionEnabled={false}
          onBack={jest.fn()}
          onDeleteAccount={onDeleteAccount}
          onOpenPrivacyPolicy={jest.fn()}
          onSaveHapticsPreference={jest.fn(() => Promise.resolve())}
          onSaveReduceMotionPreference={jest.fn(() => Promise.resolve())}
          onSaveDisplayName={jest.fn(() => Promise.resolve())}
          onSignOut={jest.fn(() => Promise.resolve())}
          onOpenTermsOfService={jest.fn()}
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
          displayName="Mina"
          hapticsEnabled
          reduceMotionEnabled={false}
          onBack={jest.fn()}
          onDeleteAccount={jest.fn(() => Promise.resolve())}
          onOpenPrivacyPolicy={jest.fn()}
          onSaveHapticsPreference={jest.fn(() => Promise.resolve())}
          onSaveReduceMotionPreference={jest.fn(() => Promise.resolve())}
          onSaveDisplayName={jest.fn(() => Promise.resolve())}
          onSignOut={jest.fn(() => Promise.reject(new Error('SIGN_OUT_FAILED')))}
          onOpenTermsOfService={jest.fn()}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(screen.getByText("We couldn't sign you out. Please try again.")).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeTruthy();
  });

  it('opens each legal document from account settings', async () => {
    await i18n.changeLanguage('en');
    const onOpenPrivacyPolicy = jest.fn();
    const onOpenTermsOfService = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <AccountSettingsScreen
          displayName="Mina"
          hapticsEnabled
          reduceMotionEnabled={false}
          onBack={jest.fn()}
          onDeleteAccount={jest.fn(() => Promise.resolve())}
          onOpenPrivacyPolicy={onOpenPrivacyPolicy}
          onSaveHapticsPreference={jest.fn(() => Promise.resolve())}
          onSaveReduceMotionPreference={jest.fn(() => Promise.resolve())}
          onSaveDisplayName={jest.fn(() => Promise.resolve())}
          onSignOut={jest.fn(() => Promise.resolve())}
          onOpenTermsOfService={onOpenTermsOfService}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Privacy policy' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Terms of service' }));

    expect(onOpenPrivacyPolicy).toHaveBeenCalledTimes(1);
    expect(onOpenTermsOfService).toHaveBeenCalledTimes(1);
  });

  it('saves a nickname without changing the Google account', async () => {
    await i18n.changeLanguage('en');
    const onSaveDisplayName = jest.fn(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <AccountSettingsScreen
          displayName="Mina"
          hapticsEnabled
          reduceMotionEnabled={false}
          onBack={jest.fn()}
          onDeleteAccount={jest.fn(() => Promise.resolve())}
          onOpenPrivacyPolicy={jest.fn()}
          onSaveHapticsPreference={jest.fn(() => Promise.resolve())}
          onSaveReduceMotionPreference={jest.fn(() => Promise.resolve())}
          onSaveDisplayName={onSaveDisplayName}
          onSignOut={jest.fn(() => Promise.resolve())}
          onOpenTermsOfService={jest.fn()}
        />
      </ThemeProvider>,
    );

    await fireEvent.changeText(screen.getByLabelText('Nickname'), 'Sky');
    await fireEvent.press(screen.getByRole('button', { name: 'Save nickname' }));

    await waitFor(() => {
      expect(onSaveDisplayName).toHaveBeenCalledWith('Sky');
    });
  });

  it('saves the vibration feedback preference immediately', async () => {
    await i18n.changeLanguage('en');
    const onSaveHapticsPreference = jest.fn(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <AccountSettingsScreen
          displayName="Mina"
          hapticsEnabled
          reduceMotionEnabled={false}
          onBack={jest.fn()}
          onDeleteAccount={jest.fn(() => Promise.resolve())}
          onOpenPrivacyPolicy={jest.fn()}
          onSaveDisplayName={jest.fn(() => Promise.resolve())}
          onSaveHapticsPreference={onSaveHapticsPreference}
          onSaveReduceMotionPreference={jest.fn(() => Promise.resolve())}
          onSignOut={jest.fn(() => Promise.resolve())}
          onOpenTermsOfService={jest.fn()}
        />
      </ThemeProvider>,
    );

    await fireEvent(
      screen.getByRole('switch', { name: 'Vibration feedback' }),
      'valueChange',
      false,
    );

    await waitFor(() => {
      expect(onSaveHapticsPreference).toHaveBeenCalledWith(false);
    });
  });

  it('saves the reduce motion preference immediately', async () => {
    await i18n.changeLanguage('en');
    const onSaveReduceMotionPreference = jest.fn(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <AccountSettingsScreen
          displayName="Mina"
          hapticsEnabled
          reduceMotionEnabled={false}
          onBack={jest.fn()}
          onDeleteAccount={jest.fn(() => Promise.resolve())}
          onOpenPrivacyPolicy={jest.fn()}
          onSaveDisplayName={jest.fn(() => Promise.resolve())}
          onSaveHapticsPreference={jest.fn(() => Promise.resolve())}
          onSaveReduceMotionPreference={onSaveReduceMotionPreference}
          onSignOut={jest.fn(() => Promise.resolve())}
          onOpenTermsOfService={jest.fn()}
        />
      </ThemeProvider>,
    );

    await fireEvent(screen.getByRole('switch', { name: 'Reduce motion' }), 'valueChange', true);

    await waitFor(() => {
      expect(onSaveReduceMotionPreference).toHaveBeenCalledWith(true);
    });
  });
});
