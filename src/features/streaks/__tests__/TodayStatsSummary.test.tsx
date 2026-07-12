import { render } from '@testing-library/react-native';

import { TodayStatsSummary } from '@/features/streaks/TodayStatsSummary';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('TodayStatsSummary', () => {
  it('shows a loading streak and an empty scheduled-routine state', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayStatsSummary
          completedCount={0}
          dailyStreak={null}
          isDailyStreakLoading
          totalCount={0}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('No routines scheduled')).toBeTruthy();
    expect(screen.getByText('Calculating…')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Today’s progress: No routines scheduled. Daily streak: Calculating….',
      ),
    ).toBeTruthy();
  });

  it('summarizes current progress and the daily streak accessibly', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayStatsSummary
          completedCount={2}
          dailyStreak={7}
          isDailyStreakLoading={false}
          totalCount={3}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('2 of 3 complete')).toBeTruthy();
    expect(screen.getByText('7 days')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Today’s progress: 2 of 3 complete. Daily streak: 7 days.',
      ),
    ).toBeTruthy();
  });
});
