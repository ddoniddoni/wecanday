import {
  createMonthlyStatistics,
  getAdjacentMonthKey,
  getMonthRoutineDayRange,
} from '@/features/statistics/domain/monthlyStatistics';

describe('monthly statistics', () => {
  it('aggregates scheduled routines by saved routine day and plan', () => {
    const statistics = createMonthlyStatistics({
      checkIns: [
        { routineDay: '2026-02-01', routineItemId: 'routine-a' },
        { routineDay: '2026-02-02', routineItemId: 'routine-a' },
      ],
      monthKey: '2026-02',
      previousMonthCheckIns: [],
      routines: [
        {
          endsOn: '2026-02-02',
          id: 'routine-a',
          planId: 'plan-a',
          planTitle: 'Study',
          scheduleWeekdays: [0, 1],
          startsOn: '2026-02-01',
        },
        {
          endsOn: '2026-02-02',
          id: 'routine-b',
          planId: 'plan-b',
          planTitle: 'Exercise',
          scheduleWeekdays: [1],
          startsOn: '2026-02-02',
        },
      ],
    });

    expect(statistics.monthKey).toBe('2026-02');
    expect(statistics.days).toHaveLength(28);
    expect(statistics.startsOnWeekday).toBe(0);
    expect(statistics.days.slice(0, 2)).toEqual([
      { completedCount: 1, completionRate: 100, routineDay: '2026-02-01', scheduledCount: 1 },
      { completedCount: 1, completionRate: 50, routineDay: '2026-02-02', scheduledCount: 2 },
    ]);
    expect(statistics.completedCount).toBe(2);
    expect(statistics.scheduledCount).toBe(3);
    expect(statistics.completedRoutineDayCount).toBe(1);
    expect(statistics.previousCompletionRate).toBeNull();
    expect(statistics.planStatistics).toEqual([
      { completedCount: 2, completionRate: 100, planId: 'plan-a', planTitle: 'Study', scheduledCount: 2 },
      { completedCount: 0, completionRate: 0, planId: 'plan-b', planTitle: 'Exercise', scheduledCount: 1 },
    ]);
  });

  it('handles month navigation across a year boundary', () => {
    expect(getAdjacentMonthKey('2026-01', -1)).toBe('2025-12');
    expect(getAdjacentMonthKey('2026-12', 1)).toBe('2027-01');
    expect(getMonthRoutineDayRange('2024-02')).toEqual({
      endsOn: '2024-02-29',
      startsOn: '2024-02-01',
    });
  });
});
