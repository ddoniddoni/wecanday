import type { SupabaseClient } from '@supabase/supabase-js';
import { render } from '@testing-library/react-native';

import { MonthlyStatisticsScreen } from '@/features/statistics/MonthlyStatisticsScreen';
import { loadMonthlyStatistics } from '@/features/statistics/services/monthlyStatisticsService';
import { i18n } from '@/i18n';
import type { Database } from '@/lib/supabase/database.types';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/statistics/services/monthlyStatisticsService', () => ({
  loadMonthlyStatistics: jest.fn(),
}));

const mockedLoadMonthlyStatistics = loadMonthlyStatistics as jest.MockedFunction<
  typeof loadMonthlyStatistics
>;

describe('MonthlyStatisticsScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockedLoadMonthlyStatistics.mockReset();
  });

  it('shows the calendar, monthly summary, and plan completion rates', async () => {
    mockedLoadMonthlyStatistics.mockResolvedValue({
      completedCount: 2,
      completedRoutineDayCount: 1,
      days: [
        { completedCount: 1, completionRate: 100, routineDay: '2026-07-01', scheduledCount: 1 },
        { completedCount: 1, completionRate: 50, routineDay: '2026-07-02', scheduledCount: 2 },
      ],
      monthKey: '2026-07',
      planStatistics: [
        { completedCount: 2, completionRate: 100, planId: 'plan-1', planTitle: 'Study', scheduledCount: 2 },
        { completedCount: 0, completionRate: 0, planId: 'plan-2', planTitle: 'Exercise', scheduledCount: 1 },
      ],
      previousCompletionRate: 40,
      scheduledCount: 3,
      startsOnWeekday: 3,
    });

    const screen = await renderScreen();

    expect(await screen.findByText('67%')).toBeTruthy();
    expect(screen.getByText('2 of 3 scheduled routines complete')).toBeTruthy();
    expect(screen.getByText('+27 percentage points from last month')).toBeTruthy();
    expect(screen.getByText('Monthly calendar')).toBeTruthy();
    expect(screen.getByText('Study')).toBeTruthy();
    expect(screen.getByText('Exercise')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Monthly completion rate: 67%. 2 of 3 scheduled routines complete. 1 routine days were fully completed.',
      ),
    ).toBeTruthy();
  });

  it('explains the empty state when no routine was scheduled in the month', async () => {
    mockedLoadMonthlyStatistics.mockResolvedValue({
      completedCount: 0,
      completedRoutineDayCount: 0,
      days: [],
      monthKey: '2026-07',
      planStatistics: [],
      previousCompletionRate: null,
      scheduledCount: 0,
      startsOnWeekday: 3,
    });

    const screen = await renderScreen();

    expect(await screen.findByText('No routines were scheduled in this month.')).toBeTruthy();
  });
});

function renderScreen() {
  return render(
    <ThemeProvider preference="light">
      <MonthlyStatisticsScreen
        client={{} as SupabaseClient<Database>}
        onBack={jest.fn()}
        routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
        userId="user-1"
      />
    </ThemeProvider>,
  );
}
