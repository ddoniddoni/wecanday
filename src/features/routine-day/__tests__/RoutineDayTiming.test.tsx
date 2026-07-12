import { act, render } from '@testing-library/react-native';

import { RoutineDayTiming } from '@/features/routine-day/RoutineDayTiming';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('RoutineDayTiming', () => {
  it('shows the configured local end time and remaining routine-day time', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineDayTiming
          clock={{ now: () => new Date('2026-07-12T18:30:01.000Z') }}
          config={{ dayStartMinute: 4 * 60, timeZone: 'Asia/Seoul' }}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Ends at')).toBeTruthy();
    expect(screen.getByText('4:00 AM')).toBeTruthy();
    expect(screen.getByText('0h 30m remaining')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'This routine day ends at 4:00 AM. 0 hours and 30 minutes remaining.',
      ),
    ).toBeTruthy();
  });

  it('updates the remaining time at the next minute boundary', async () => {
    await i18n.changeLanguage('en');
    jest.useFakeTimers();
    let now = new Date('2026-07-12T18:30:01.000Z');
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineDayTiming
          clock={{ now: () => now }}
          config={{ dayStartMinute: 4 * 60, timeZone: 'Asia/Seoul' }}
        />
      </ThemeProvider>,
    );

    now = new Date('2026-07-12T18:31:00.000Z');
    await act(async () => {
      await jest.advanceTimersByTimeAsync(59_000);
    });

    expect(screen.getByText('0h 29m remaining')).toBeTruthy();
    jest.useRealTimers();
  });
});
