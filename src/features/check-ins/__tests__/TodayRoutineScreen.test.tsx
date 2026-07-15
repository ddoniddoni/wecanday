import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { TodayRoutineScreen } from '@/features/check-ins/TodayRoutineScreen';
import type { TodayRoutineItem } from '@/features/check-ins/domain/todayRoutines';
import { completeCheckIn, loadTodayRoutineItems } from '@/features/check-ins/services/checkInService';
import { playRoutineCompletionHaptic } from '@/features/check-ins/services/completionHaptics';
import { i18n } from '@/i18n';
import type { Database } from '@/lib/supabase/database.types';
import { systemClock } from '@/features/routine-day/domain/routineDay';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/check-ins/services/checkInOutboxService', () => ({
  synchronizePendingCheckIns: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/features/check-ins/services/checkInService', () => ({
  completeCheckIn: jest.fn(() => Promise.resolve()),
  loadTodayRoutineItems: jest.fn(() =>
    Promise.resolve([
      {
        completedAt: null,
        id: 'routine-1',
        reminder_minute: 540,
        schedule_weekdays: [0],
        sort_order: 0,
        syncStatus: null,
        title: 'Morning walk',
      },
    ]),
  ),
  undoCheckIn: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/features/check-ins/services/completionHaptics', () => ({
  playRoutineCompletionHaptic: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/features/companion/services/companionProgressService', () => ({
  loadCompanionProgress: jest.fn(() =>
    Promise.resolve({
      experience: 0,
      experienceInLevel: 0,
      experienceToNextLevel: 50,
      level: 1,
    }),
  ),
}));

jest.mock('@/features/streaks/services/dailyStreakService', () => ({
  loadCurrentDailyStreak: jest.fn(() => Promise.resolve(0)),
}));

jest.mock('@/local-db/checkInOutbox', () => ({
  createCheckInOutboxOperation: jest.fn(() => ({
    createdAt: '2026-07-12T01:00:00.000Z',
    id: 'operation-1',
    idempotencyKey: 'operation-1',
    kind: 'complete',
    occurredAt: '2026-07-12T01:00:00.000Z',
    routineDay: '2026-07-12',
    routineItemId: 'routine-1',
    userId: 'user-1',
  })),
  enqueueCheckInOperation: jest.fn(() => Promise.resolve()),
  loadPendingCheckInOperations: jest.fn(() => Promise.resolve([])),
  removeCheckInOperationsForRoutine: jest.fn(() => Promise.resolve()),
}));

function createDeferred<T>() {
  let resolvePromise: (value: T | PromiseLike<T>) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return { promise, resolve: resolvePromise };
}

describe('TodayRoutineScreen', () => {
  beforeEach(() => {
    jest.spyOn(systemClock, 'now').mockReturnValue(new Date('2026-07-14T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.mocked(loadTodayRoutineItems).mockReset();
    jest.mocked(loadTodayRoutineItems).mockResolvedValue([
      {
        completedAt: null,
        id: 'routine-1',
        reminder_minute: 540,
        schedule_weekdays: [0],
        sort_order: 0,
        syncStatus: null,
        title: 'Morning walk',
      },
    ]);
  });

  it('optimistically completes a routine item and sends its idempotency key', async () => {
    await i18n.changeLanguage('en');
    const onRoutineCompletionChanged = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineScreen
          client={{} as SupabaseClient<Database>}
          companionId="sprout"
          hasPlanCreationSuccess={false}
          isHapticsEnabled
          isMotionReduced={false}
          onCreatePlan={jest.fn()}
          onEditRoutine={jest.fn()}
          onOpenPlans={jest.fn()}
          onOpenProfile={jest.fn()}
          onOpenStatistics={jest.fn()}
          onRoutineCompletionChanged={onRoutineCompletionChanged}
          routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
          userId="user-1"
        />
      </ThemeProvider>,
    );

    await screen.findByRole('checkbox', { name: 'Complete Morning walk' });
    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'Complete Morning walk' }),
    );

    await waitFor(() => {
      expect(screen.getByText('1 of 1 complete')).toBeTruthy();
      expect(screen.getByText('Nice work! You did it.')).toBeTruthy();
      expect(screen.getByText('+10 XP')).toBeTruthy();
      expect(screen.getByText('1 day in a row!')).toBeTruthy();
      expect(playRoutineCompletionHaptic).toHaveBeenCalledWith({
        isEnabled: true,
        shouldReduceMotion: false,
      });
      expect(completeCheckIn).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          idempotencyKey: 'operation-1',
          routineItemId: 'routine-1',
          source: 'online',
        }),
      );
      expect(onRoutineCompletionChanged).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'routine-1' }),
        true,
      );
    });
  });

  it('uses reduced feedback when the account preference is enabled', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineScreen
          client={{} as SupabaseClient<Database>}
          companionId="sprout"
          hasPlanCreationSuccess={false}
          isHapticsEnabled
          isMotionReduced
          onCreatePlan={jest.fn()}
          onEditRoutine={jest.fn()}
          onOpenPlans={jest.fn()}
          onOpenProfile={jest.fn()}
          onOpenStatistics={jest.fn()}
          onRoutineCompletionChanged={jest.fn()}
          routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
          userId="user-1"
        />
      </ThemeProvider>,
    );

    await screen.findByRole('checkbox', { name: 'Complete Morning walk' });
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Complete Morning walk' }));

    await waitFor(() => {
      expect(playRoutineCompletionHaptic).toHaveBeenCalledWith({
        isEnabled: true,
        shouldReduceMotion: true,
      });
    });
  });

  it('opens the focused routine execution screen from a routine row', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineScreen
          client={{} as SupabaseClient<Database>}
          companionId="sprout"
          hasPlanCreationSuccess={false}
          isHapticsEnabled
          isMotionReduced={false}
          onCreatePlan={jest.fn()}
          onEditRoutine={jest.fn()}
          onOpenPlans={jest.fn()}
          onOpenProfile={jest.fn()}
          onOpenStatistics={jest.fn()}
          onRoutineCompletionChanged={jest.fn()}
          routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
          userId="user-1"
        />
      </ThemeProvider>,
    );

    await screen.findByRole('button', { name: 'Start Morning walk' });
    await fireEvent.press(screen.getByRole('button', { name: 'Start Morning walk' }));

    expect(await screen.findByText('DO THIS NOW')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Complete Morning walk' })).toBeTruthy();
  });

  it('shows a selected non-current routine day as read-only history', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineScreen
          client={{} as SupabaseClient<Database>}
          companionId="sprout"
          hasPlanCreationSuccess={false}
          isHapticsEnabled
          isMotionReduced={false}
          onCreatePlan={jest.fn()}
          onEditRoutine={jest.fn()}
          onOpenPlans={jest.fn()}
          onOpenProfile={jest.fn()}
          onOpenStatistics={jest.fn()}
          onRoutineCompletionChanged={jest.fn()}
          routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
          userId="user-1"
        />
      </ThemeProvider>,
    );

    await screen.findByRole('checkbox', { name: 'Complete Morning walk' });
    await fireEvent.press(screen.getByRole('button', { name: /Select Monday, July 13, 2026/ }));

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'Review Morning walk' }).props.accessibilityState,
      ).toMatchObject({ disabled: true });
    });
  });

  it('keeps the most recently selected date visible when an older request resolves later', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineScreen
          client={{} as SupabaseClient<Database>}
          companionId="sprout"
          hasPlanCreationSuccess={false}
          isHapticsEnabled
          isMotionReduced={false}
          onCreatePlan={jest.fn()}
          onEditRoutine={jest.fn()}
          onOpenPlans={jest.fn()}
          onOpenProfile={jest.fn()}
          onOpenStatistics={jest.fn()}
          onRoutineCompletionChanged={jest.fn()}
          routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
          userId="user-1"
        />
      </ThemeProvider>,
    );
    await screen.findByRole('checkbox', { name: 'Complete Morning walk' });

    const historyRequest = createDeferred<TodayRoutineItem[]>();
    const todayRequest = createDeferred<TodayRoutineItem[]>();
    jest.mocked(loadTodayRoutineItems).mockImplementation((_client, _userId, routineDay) => {
      if (routineDay === '2026-07-11') {
        return historyRequest.promise;
      }

      if (routineDay === '2026-07-14') {
        return todayRequest.promise;
      }

      return Promise.resolve([]);
    });

    await fireEvent.press(
      screen.getByRole('button', { name: 'Select Saturday, July 11, 2026' }),
    );
    await waitFor(() => {
      expect(loadTodayRoutineItems).toHaveBeenCalledWith(expect.anything(), 'user-1', '2026-07-11');
    });
    await fireEvent.press(
      screen.getByRole('button', { name: /Select Tuesday, July 14, 2026/ }),
    );
    await waitFor(() => {
      expect(loadTodayRoutineItems).toHaveBeenCalledWith(expect.anything(), 'user-1', '2026-07-14');
    });

    todayRequest.resolve([
      {
        completedAt: null,
        id: 'current-routine',
        reminder_minute: 540,
        schedule_weekdays: [0],
        sort_order: 0,
        syncStatus: null,
        title: 'Current routine',
      },
    ]);
    expect(await screen.findByRole('checkbox', { name: 'Complete Current routine' })).toBeTruthy();

    historyRequest.resolve([
      {
        completedAt: null,
        id: 'stale-routine',
        reminder_minute: 540,
        schedule_weekdays: [6],
        sort_order: 0,
        syncStatus: null,
        title: 'Stale routine',
      },
    ]);
    await waitFor(() => {
      expect(screen.queryByText('Stale routine')).toBeNull();
      expect(screen.getByRole('checkbox', { name: 'Complete Current routine' })).toBeTruthy();
    });
  });

  it('shows a clear empty state when the current routine day has no items', async () => {
    jest.mocked(loadTodayRoutineItems).mockResolvedValueOnce([]);
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineScreen
          client={{} as SupabaseClient<Database>}
          companionId="sprout"
          hasPlanCreationSuccess={false}
          isHapticsEnabled
          isMotionReduced={false}
          onCreatePlan={jest.fn()}
          onEditRoutine={jest.fn()}
          onOpenPlans={jest.fn()}
          onOpenProfile={jest.fn()}
          onOpenStatistics={jest.fn()}
          onRoutineCompletionChanged={jest.fn()}
          routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
          userId="user-1"
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Loading today’s routines…')).toBeTruthy();
    expect(await screen.findByText('Nothing is scheduled for this routine day.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create a plan' })).toBeTruthy();
  });
});
