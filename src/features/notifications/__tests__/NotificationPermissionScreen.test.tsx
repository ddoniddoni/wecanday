import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { NotificationPermissionScreen } from '@/features/notifications/NotificationPermissionScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('NotificationPermissionScreen', () => {
  it('lets the user continue normally after denying notification permission', async () => {
    await i18n.changeLanguage('en');
    const onContinue = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <NotificationPermissionScreen
          onAllow={() => Promise.resolve('denied')}
          onContinue={onContinue}
          onNotNow={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Would you like routine reminders?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Allow reminders' }));

    await screen.findByText('Reminders are off');

    expect(screen.getByText('Reminders are off')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('allows the user to defer the permission request', async () => {
    await i18n.changeLanguage('en');
    const onNotNow = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <NotificationPermissionScreen
          onAllow={() => Promise.resolve('granted')}
          onContinue={jest.fn()}
          onNotNow={onNotNow}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));

    await waitFor(() => {
      expect(onNotNow).toHaveBeenCalledTimes(1);
    });
  });
});
