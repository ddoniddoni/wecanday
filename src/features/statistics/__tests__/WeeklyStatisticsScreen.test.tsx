import type { SupabaseClient } from '@supabase/supabase-js';
import { render } from '@testing-library/react-native';

import { WeeklyStatisticsScreen } from '@/features/statistics/WeeklyStatisticsScreen';
import { loadWeeklyStatistics } from '@/features/statistics/services/weeklyStatisticsService';
import { i18n } from '@/i18n';
import type { Database } from '@/lib/supabase/database.types';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/statistics/services/weeklyStatisticsService', () => ({
  loadWeeklyStatistics: jest.fn(),
}));

const mockedLoadWeeklyStatistics = loadWeeklyStatistics as jest.MockedFunction<
  typeof loadWeeklyStatistics
>;

describe('WeeklyStatisticsScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockedLoadWeeklyStatistics.mockReset();
  });

  it('shows a completion summary, daily progress, and accessible streak summary', async () => {
    mockedLoadWeeklyStatistics.mockResolvedValue({
      completedCount: 3,
      currentDailyStreak: 2,
      days: [
        { completedCount: 1, completionRate: 100, routineDay: '2026-07-06', scheduledCount: 1 },
        { completedCount: 0, completionRate: null, routineDay: '2026-07-07', scheduledCount: 0 },
        { completedCount: 2, completionRate: 100, routineDay: '2026-07-08', scheduledCount: 2 },
      ],
      highestDailyStreak: 4,
      scheduledCount: 3,
    });

    const screen = await renderScreen();

    expect(await screen.findByText('100%')).toBeTruthy();
    expect(screen.getByText('3 of 3 scheduled routines complete')).toBeTruthy();
    expect(screen.getByText('1/1').props.numberOfLines).toBe(1);
    expect(screen.getByText('2/2').props.numberOfLines).toBe(1);
    expect(screen.getByText('Rest day')).toBeTruthy();
    expect(screen.getByText('2 days')).toBeTruthy();
    expect(screen.getByText('4 days')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Weekly completion rate: 100%. 3 of 3 scheduled routines complete. Current daily streak: 2. Highest daily streak: 4.',
      ),
    ).toBeTruthy();
  });

  it('explains the empty state when no routine was scheduled', async () => {
    mockedLoadWeeklyStatistics.mockResolvedValue({
      completedCount: 0,
      currentDailyStreak: 0,
      days: [],
      highestDailyStreak: 0,
      scheduledCount: 0,
    });

    const screen = await renderScreen();

    expect(
      await screen.findByText('No routines were scheduled in the last seven routine days.'),
    ).toBeTruthy();
  });
});

function renderScreen() {
  return render(
    <ThemeProvider preference="light">
      <WeeklyStatisticsScreen
        client={{} as SupabaseClient<Database>}
        onBack={jest.fn()}
        routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
        userId="user-1"
      />
    </ThemeProvider>,
  );
}
