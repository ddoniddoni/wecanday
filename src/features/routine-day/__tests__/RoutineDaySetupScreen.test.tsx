import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { RoutineDaySetupScreen } from '@/features/routine-day/RoutineDaySetupScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('RoutineDaySetupScreen', () => {
  it('changes the day-start time by one hour and saves it', async () => {
    await i18n.changeLanguage('en');
    const onSave = jest.fn<Promise<void>, [{ dayStartMinute: number; timeZone: string }]>(
      () => Promise.resolve(),
    );
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineDaySetupScreen
          initialTimeZone="Asia/Seoul"
          onSave={onSave}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Choose a day start time one hour later',
      }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        dayStartMinute: 300,
        timeZone: 'Asia/Seoul',
      });
    });
  });

  it('saves a directly entered HH:MM day-start time', async () => {
    await i18n.changeLanguage('en');
    const onSave = jest.fn<Promise<void>, [{ dayStartMinute: number; timeZone: string }]>(
      () => Promise.resolve(),
    );
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineDaySetupScreen
          initialTimeZone="Asia/Seoul"
          onSave={onSave}
        />
      </ThemeProvider>,
    );

    await fireEvent.changeText(screen.getByDisplayValue('04:00'), '05:37');
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        dayStartMinute: 337,
        timeZone: 'Asia/Seoul',
      });
    });
  });

  it('keeps an invalid time zone on screen and explains how to correct it', async () => {
    await i18n.changeLanguage('en');
    const onSave = jest.fn<Promise<void>, [{ dayStartMinute: number; timeZone: string }]>(
      () => Promise.resolve(),
    );
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineDaySetupScreen
          initialTimeZone="Asia/Seoul"
          onSave={onSave}
        />
      </ThemeProvider>,
    );

    await fireEvent.changeText(
      screen.getByDisplayValue('Asia/Seoul'),
      'Not/A_TimeZone',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(
      screen.getByText('Enter a valid IANA time zone, such as Asia/Seoul.'),
    ).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('explains the required time format before saving', async () => {
    await i18n.changeLanguage('en');
    const onSave = jest.fn<Promise<void>, [{ dayStartMinute: number; timeZone: string }]>(
      () => Promise.resolve(),
    );
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineDaySetupScreen
          initialTimeZone="Asia/Seoul"
          onSave={onSave}
        />
      </ThemeProvider>,
    );

    await fireEvent.changeText(screen.getByDisplayValue('04:00'), '25:00');
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Enter a time from 00:00 to 23:59.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
