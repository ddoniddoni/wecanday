import type { SupabaseClient } from '@supabase/supabase-js';
import { render } from '@testing-library/react-native';

import { AnnualStatisticsScreen } from '@/features/statistics/AnnualStatisticsScreen';
import { loadAnnualStatistics } from '@/features/statistics/services/annualStatisticsService';
import { i18n } from '@/i18n';
import type { Database } from '@/lib/supabase/database.types';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/statistics/services/annualStatisticsService', () => ({ loadAnnualStatistics: jest.fn() }));

const mockedLoadAnnualStatistics = loadAnnualStatistics as jest.MockedFunction<typeof loadAnnualStatistics>;

describe('AnnualStatisticsScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockedLoadAnnualStatistics.mockReset();
  });

  it('shows the annual heatmap summary and monthly trend', async () => {
    mockedLoadAnnualStatistics.mockResolvedValue({
      completedCount: 2,
      days: [
        { completedCount: 1, completionRate: 100, routineDay: '2026-01-01', scheduledCount: 1 },
        { completedCount: 1, completionRate: 50, routineDay: '2026-01-02', scheduledCount: 2 },
      ],
      highestDailyStreak: 2,
      monthlyTrends: Array.from({ length: 12 }, (_, index) => ({ completedCount: index === 0 ? 2 : 0, completionRate: index === 0 ? 67 : null, monthKey: `2026-${String(index + 1).padStart(2, '0')}`, scheduledCount: index === 0 ? 3 : 0 })),
      scheduledCount: 3,
      totalCheckInCount: 2,
      year: '2026',
    });

    const screen = await renderScreen();

    expect(await screen.findAllByText('67%')).toHaveLength(2);
    expect(screen.getByText('12-month heatmap')).toBeTruthy();
    expect(screen.getByText('Monthly trend')).toBeTruthy();
    expect(screen.getByText('2 days')).toBeTruthy();
    expect(screen.getByLabelText('Annual completion rate: 67%. 2 of 3 scheduled routines complete. 2 total check-ins. Highest daily streak: 2.')).toBeTruthy();
  });

  it('explains the empty state', async () => {
    mockedLoadAnnualStatistics.mockResolvedValue({ completedCount: 0, days: [], highestDailyStreak: 0, monthlyTrends: [], scheduledCount: 0, totalCheckInCount: 0, year: '2026' });

    const screen = await renderScreen();

    expect(await screen.findByText('No routines were scheduled in this year.')).toBeTruthy();
  });
});

function renderScreen() {
  return render(<ThemeProvider preference="light"><AnnualStatisticsScreen client={{} as SupabaseClient<Database>} onBack={jest.fn()} routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }} userId="user-1" /></ThemeProvider>);
}
