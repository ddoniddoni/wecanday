import {
  applyPendingCheckInOperations,
  createTodayRoutineItems,
  getRoutineDayRange,
  getRoutineTimeOfDay,
  groupTodayRoutineItems,
  isRoutineScheduledForDay,
} from '@/features/check-ins/domain/todayRoutines';

describe('today routine domain', () => {
  it('uses the routine-day calendar weekday rather than the UTC date', () => {
    expect(
      isRoutineScheduledForDay(
        { schedule_weekdays: [0] },
        '2026-07-12',
      ),
    ).toBe(true);
    expect(
      isRoutineScheduledForDay(
        { schedule_weekdays: [1] },
        '2026-07-12',
      ),
    ).toBe(false);
  });

  it('shows only scheduled items and maps completed check-ins by routine item', () => {
    expect(
      createTodayRoutineItems(
        [
          { id: 'routine-1', reminder_minute: 540, schedule_weekdays: [0], sort_order: 0, title: 'Walk' },
          { id: 'routine-2', reminder_minute: null, schedule_weekdays: [1], sort_order: 1, title: 'Read' },
        ],
        '2026-07-12',
        new Map([['routine-1', '2026-07-12T01:00:00.000Z']]),
      ),
    ).toEqual([
        {
          completedAt: '2026-07-12T01:00:00.000Z',
          id: 'routine-1',
          reminder_minute: 540,
          schedule_weekdays: [0],
          sort_order: 0,
        syncStatus: null,
        title: 'Walk',
      },
    ]);
  });

  it('keeps the latest local operation as the visible offline state', () => {
    expect(
      applyPendingCheckInOperations(
        [
          {
            completedAt: '2026-07-12T01:00:00.000Z',
            id: 'routine-1',
            reminder_minute: 540,
            schedule_weekdays: [0],
            sort_order: 0,
            syncStatus: null,
            title: 'Walk',
          },
        ],
        [
          {
            createdAt: '2026-07-12T02:00:00.000Z',
            kind: 'complete',
            routineItemId: 'routine-1',
          },
          {
            createdAt: '2026-07-12T03:00:00.000Z',
            kind: 'undo',
            routineItemId: 'routine-1',
          },
        ],
      ),
    ).toEqual([
      {
        completedAt: null,
        id: 'routine-1',
        reminder_minute: 540,
        schedule_weekdays: [0],
        sort_order: 0,
        syncStatus: 'queued',
        title: 'Walk',
      },
    ]);
  });

  it('groups routines by time of day and orders each group by scheduled time', () => {
    expect(
      groupTodayRoutineItems([
        { completedAt: null, id: 'anytime', reminder_minute: null, schedule_weekdays: [0], sort_order: 0, syncStatus: null, title: 'Journal' },
        { completedAt: null, id: 'evening', reminder_minute: 1140, schedule_weekdays: [0], sort_order: 0, syncStatus: null, title: 'Stretch' },
        { completedAt: null, id: 'morning-late', reminder_minute: 540, schedule_weekdays: [0], sort_order: 1, syncStatus: null, title: 'Read' },
        { completedAt: null, id: 'morning-early', reminder_minute: 420, schedule_weekdays: [0], sort_order: 0, syncStatus: null, title: 'Walk' },
        { completedAt: null, id: 'daytime', reminder_minute: 780, schedule_weekdays: [0], sort_order: 0, syncStatus: null, title: 'Lunch walk' },
      ]),
    ).toEqual([
      expect.objectContaining({ key: 'morning', items: [expect.objectContaining({ id: 'morning-early' }), expect.objectContaining({ id: 'morning-late' })] }),
      expect.objectContaining({ key: 'daytime', items: [expect.objectContaining({ id: 'daytime' })] }),
      expect.objectContaining({ key: 'evening', items: [expect.objectContaining({ id: 'evening' })] }),
      expect.objectContaining({ key: 'anytime', items: [expect.objectContaining({ id: 'anytime' })] }),
    ]);
    expect(getRoutineTimeOfDay(30)).toBe('evening');
  });

  it('orders grouped routines without mutating the original routine list', () => {
    const routines = [
      { completedAt: null, id: 'later', reminder_minute: 540, schedule_weekdays: [0], sort_order: 1, syncStatus: null, title: 'Later' },
      { completedAt: null, id: 'earlier', reminder_minute: 480, schedule_weekdays: [0], sort_order: 0, syncStatus: null, title: 'Earlier' },
    ];

    expect(groupTodayRoutineItems(routines)[0]?.items.map((item) => item.id)).toEqual([
      'earlier',
      'later',
    ]);
    expect(routines.map((item) => item.id)).toEqual(['later', 'earlier']);
  });

  it('builds a seven-day range across month boundaries without using the device time zone', () => {
    expect(getRoutineDayRange('2026-08-01')).toEqual([
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
    ]);
  });
});
