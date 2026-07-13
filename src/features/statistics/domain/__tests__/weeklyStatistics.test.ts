import { createWeeklyStatistics } from '@/features/statistics/domain/weeklyStatistics';

describe('createWeeklyStatistics', () => {
  it('uses the saved routine days and excludes rest days from the completion denominator', () => {
    const statistics = createWeeklyStatistics({
      days: [
        completedDay('2026-07-06', ['a', 'b', 'c', 'd']),
        completedDay('2026-07-07', []),
        restDay('2026-07-08'),
        completedDay('2026-07-09', ['a']),
        completedDay('2026-07-10', ['a']),
        completedDay('2026-07-11', ['a']),
        completedDay('2026-07-12', ['a']),
      ],
      startsOn: '2026-07-06',
      throughRoutineDay: '2026-07-12',
    });

    expect(statistics.days).toEqual([
      { completedCount: 4, completionRate: 100, routineDay: '2026-07-06', scheduledCount: 4 },
      { completedCount: 0, completionRate: 0, routineDay: '2026-07-07', scheduledCount: 1 },
      { completedCount: 0, completionRate: null, routineDay: '2026-07-08', scheduledCount: 0 },
      { completedCount: 1, completionRate: 100, routineDay: '2026-07-09', scheduledCount: 1 },
      { completedCount: 1, completionRate: 100, routineDay: '2026-07-10', scheduledCount: 1 },
      { completedCount: 1, completionRate: 100, routineDay: '2026-07-11', scheduledCount: 1 },
      { completedCount: 1, completionRate: 100, routineDay: '2026-07-12', scheduledCount: 1 },
    ]);
    expect(statistics.completedCount).toBe(8);
    expect(statistics.scheduledCount).toBe(9);
    expect(statistics.currentDailyStreak).toBe(4);
    expect(statistics.highestDailyStreak).toBe(4);
  });

  it('returns a seven-day empty series when there are no routines', () => {
    const statistics = createWeeklyStatistics({
      days: [],
      startsOn: '2026-07-12',
      throughRoutineDay: '2026-07-12',
    });

    expect(statistics.days).toHaveLength(7);
    expect(statistics.days.every((day) => day.completionRate === null)).toBe(true);
    expect(statistics.completedCount).toBe(0);
    expect(statistics.scheduledCount).toBe(0);
    expect(statistics.currentDailyStreak).toBe(0);
    expect(statistics.highestDailyStreak).toBe(0);
  });
});

function completedDay(routineDay: string, completedRoutineItemIds: string[]) {
  const scheduledRoutineItemIds = routineDay === '2026-07-06'
    ? ['a', 'b', 'c', 'd']
    : ['a'];

  return { completedRoutineItemIds, routineDay, scheduledRoutineItemIds };
}

function restDay(routineDay: string) {
  return { completedRoutineItemIds: [], routineDay, scheduledRoutineItemIds: [] };
}
