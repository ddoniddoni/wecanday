import { render } from '@testing-library/react-native';

import { StreakMomentCard } from '@/features/streaks/StreakMomentCard';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('StreakMomentCard', () => {
  it('celebrates a completed routine day', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <StreakMomentCard dailyStreak={3} isAllComplete />
      </ThemeProvider>,
    );

    expect(screen.getByText('3 days in a row!')).toBeTruthy();
  });

  it('uses a gentle restart message instead of a failure message', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <StreakMomentCard dailyStreak={0} isAllComplete={false} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Start with one step today')).toBeTruthy();
    expect(screen.queryByText(/missed|failed/i)).toBeNull();
  });

  it('stays out of the way while an existing run is still in progress', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <StreakMomentCard dailyStreak={2} isAllComplete={false} />
      </ThemeProvider>,
    );

    expect(screen.toJSON()).toBeNull();
  });
});
