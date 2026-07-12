import {
  calculateRoutineItemStreak,
  getRoutineItemStatusOnDay,
  isRoutineItemScheduledOnDay,
} from '@/features/streaks/domain/itemStreak';

describe('routine item streak domain', () => {
  it('orders status events without mutating the supplied history', () => {
    const statusEvents = [
      { effectiveRoutineDay: '2026-07-08', status: 'active' as const },
      { effectiveRoutineDay: '2026-07-07', status: 'paused' as const },
    ];

    expect(getRoutineItemStatusOnDay(statusEvents, '2026-07-07')).toBe('paused');
    expect(statusEvents).toEqual([
      { effectiveRoutineDay: '2026-07-08', status: 'active' },
      { effectiveRoutineDay: '2026-07-07', status: 'paused' },
    ]);
  });

  it('counts three consecutive daily completions', () => {
    expect(
      calculateRoutineItemStreak({
        completedRoutineDays: ['2026-07-06', '2026-07-07', '2026-07-08'],
        scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6],
        startsOn: '2026-07-06',
        throughRoutineDay: '2026-07-08',
      }),
    ).toBe(3);
  });

  it('does not break a weekday-only streak across unscheduled weekends', () => {
    expect(
      calculateRoutineItemStreak({
        completedRoutineDays: [
          '2026-07-06',
          '2026-07-07',
          '2026-07-08',
          '2026-07-09',
          '2026-07-10',
          '2026-07-13',
        ],
        scheduleWeekdays: [1, 2, 3, 4, 5],
        startsOn: '2026-07-06',
        throughRoutineDay: '2026-07-13',
      }),
    ).toBe(6);
  });

  it('starts a new streak after a missed scheduled day', () => {
    expect(
      calculateRoutineItemStreak({
        completedRoutineDays: ['2026-07-06', '2026-07-07', '2026-07-09'],
        scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6],
        startsOn: '2026-07-06',
        throughRoutineDay: '2026-07-09',
      }),
    ).toBe(1);
  });

  it('excludes routine days paused before their scheduled status', () => {
    expect(
      calculateRoutineItemStreak({
        completedRoutineDays: ['2026-07-06', '2026-07-07', '2026-07-10'],
        scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6],
        startsOn: '2026-07-06',
        statusEvents: [
          { effectiveRoutineDay: '2026-07-08', status: 'paused' },
          { effectiveRoutineDay: '2026-07-10', status: 'active' },
        ],
        throughRoutineDay: '2026-07-10',
      }),
    ).toBe(3);
  });

  it('does not schedule a routine with no selected weekdays', () => {
    const input = {
      endsOn: null,
      scheduleWeekdays: [],
      startsOn: '2026-07-06',
    };

    expect(isRoutineItemScheduledOnDay(input, '2026-07-06')).toBe(false);
    expect(
      calculateRoutineItemStreak({
        ...input,
        completedRoutineDays: ['2026-07-06'],
        throughRoutineDay: '2026-07-06',
      }),
    ).toBe(0);
  });
});
