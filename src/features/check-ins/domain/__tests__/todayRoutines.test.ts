import {
  applyPendingCheckInOperations,
  createTodayRoutineItems,
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
          { id: 'routine-1', schedule_weekdays: [0], title: 'Walk' },
          { id: 'routine-2', schedule_weekdays: [1], title: 'Read' },
        ],
        '2026-07-12',
        new Map([['routine-1', '2026-07-12T01:00:00.000Z']]),
      ),
    ).toEqual([
      {
        completedAt: '2026-07-12T01:00:00.000Z',
        id: 'routine-1',
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
        syncStatus: 'queued',
        title: 'Walk',
      },
    ]);
  });
});
