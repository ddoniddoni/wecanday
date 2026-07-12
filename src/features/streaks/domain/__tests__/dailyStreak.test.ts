import {
  calculateCurrentDailyStreak,
  calculateDailyStreak,
  createDailyStreakDays,
  isDailyStreakDayComplete,
} from '@/features/streaks/domain/dailyStreak';

describe('daily streak domain', () => {
  it('counts three days where every scheduled routine item is complete', () => {
    expect(
      calculateDailyStreak({
        days: [
          {
            completedRoutineItemIds: ['read', 'walk'],
            routineDay: '2026-07-06',
            scheduledRoutineItemIds: ['read', 'walk'],
          },
          {
            completedRoutineItemIds: ['read'],
            routineDay: '2026-07-07',
            scheduledRoutineItemIds: ['read'],
          },
          {
            completedRoutineItemIds: ['read', 'walk'],
            routineDay: '2026-07-08',
            scheduledRoutineItemIds: ['read', 'walk'],
          },
        ],
        startsOn: '2026-07-06',
        throughRoutineDay: '2026-07-08',
      }),
    ).toBe(3);
  });

  it('does not increase or break the streak for a day without scheduled routine items', () => {
    expect(
      calculateDailyStreak({
        days: [
          {
            completedRoutineItemIds: ['walk'],
            routineDay: '2026-07-06',
            scheduledRoutineItemIds: ['walk'],
          },
          {
            completedRoutineItemIds: [],
            routineDay: '2026-07-07',
            scheduledRoutineItemIds: [],
          },
          {
            completedRoutineItemIds: ['walk'],
            routineDay: '2026-07-08',
            scheduledRoutineItemIds: ['walk'],
          },
        ],
        startsOn: '2026-07-06',
        throughRoutineDay: '2026-07-08',
      }),
    ).toBe(2);
  });

  it('starts a new daily streak after one scheduled item is missed', () => {
    expect(
      calculateDailyStreak({
        days: [
          {
            completedRoutineItemIds: ['walk'],
            routineDay: '2026-07-06',
            scheduledRoutineItemIds: ['walk'],
          },
          {
            completedRoutineItemIds: ['walk'],
            routineDay: '2026-07-07',
            scheduledRoutineItemIds: ['walk', 'read'],
          },
          {
            completedRoutineItemIds: ['walk', 'read'],
            routineDay: '2026-07-08',
            scheduledRoutineItemIds: ['walk', 'read'],
          },
        ],
        startsOn: '2026-07-06',
        throughRoutineDay: '2026-07-08',
      }),
    ).toBe(1);
  });

  it('returns zero when no routine item is scheduled', () => {
    const day = {
      completedRoutineItemIds: ['walk'],
      routineDay: '2026-07-06',
      scheduledRoutineItemIds: [],
    };

    expect(isDailyStreakDayComplete(day)).toBe(false);
    expect(
      calculateDailyStreak({
        days: [day],
        startsOn: '2026-07-06',
        throughRoutineDay: '2026-07-06',
      }),
    ).toBe(0);
  });

  it('keeps the last completed daily streak while today is still in progress', () => {
    expect(
      calculateCurrentDailyStreak({
        days: [
          {
            completedRoutineItemIds: ['walk'],
            routineDay: '2026-07-06',
            scheduledRoutineItemIds: ['walk'],
          },
          {
            completedRoutineItemIds: ['walk'],
            routineDay: '2026-07-07',
            scheduledRoutineItemIds: ['walk'],
          },
          {
            completedRoutineItemIds: [],
            routineDay: '2026-07-08',
            scheduledRoutineItemIds: ['walk'],
          },
        ],
        startsOn: '2026-07-06',
        throughRoutineDay: '2026-07-08',
      }),
    ).toBe(2);
  });

  it('builds neutral days for a paused routine', () => {
    expect(
      createDailyStreakDays({
        checkIns: [
          { routineDay: '2026-07-06', routineItemId: 'walk' },
          { routineDay: '2026-07-08', routineItemId: 'walk' },
        ],
        routines: [
          {
            id: 'walk',
            scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6],
            startsOn: '2026-07-06',
            statusEvents: [
              { effectiveRoutineDay: '2026-07-07', status: 'paused' },
              { effectiveRoutineDay: '2026-07-08', status: 'active' },
            ],
          },
        ],
        throughRoutineDay: '2026-07-08',
      }),
    ).toEqual([
      {
        completedRoutineItemIds: ['walk'],
        routineDay: '2026-07-06',
        scheduledRoutineItemIds: ['walk'],
      },
      {
        completedRoutineItemIds: [],
        routineDay: '2026-07-07',
        scheduledRoutineItemIds: [],
      },
      {
        completedRoutineItemIds: ['walk'],
        routineDay: '2026-07-08',
        scheduledRoutineItemIds: ['walk'],
      },
    ]);
  });
});
