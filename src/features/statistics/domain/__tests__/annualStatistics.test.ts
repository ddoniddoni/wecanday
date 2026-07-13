import { createAnnualStatistics, getAdjacentYear, getYearRoutineDayRange } from '@/features/statistics/domain/annualStatistics';

describe('annual statistics', () => {
  it('builds a 12-month summary from saved routine days', () => {
    const statistics = createAnnualStatistics({
      checkIns: [
        { routineDay: '2026-01-01', routineItemId: 'routine-1' },
        { routineDay: '2026-01-02', routineItemId: 'routine-1' },
      ],
      routines: [{ endsOn: '2026-01-03', id: 'routine-1', scheduleWeekdays: [4, 5, 6], startsOn: '2026-01-01' }],
      year: '2026',
    });

    expect(statistics.days).toHaveLength(365);
    expect(statistics.completedCount).toBe(2);
    expect(statistics.scheduledCount).toBe(3);
    expect(statistics.totalCheckInCount).toBe(2);
    expect(statistics.highestDailyStreak).toBe(2);
    expect(statistics.monthlyTrends[0]).toEqual({ completedCount: 2, completionRate: 67, monthKey: '2026-01', scheduledCount: 3 });
    expect(statistics.monthlyTrends[1].completionRate).toBeNull();
  });

  it('supports leap years and year navigation', () => {
    expect(getYearRoutineDayRange('2024')).toEqual({ endsOn: '2024-12-31', startsOn: '2024-01-01' });
    expect(getAdjacentYear('2026', -1)).toBe('2025');
    expect(getAdjacentYear('2026', 1)).toBe('2027');
  });
});
