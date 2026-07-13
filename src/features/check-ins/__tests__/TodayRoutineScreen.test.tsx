import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { TodayRoutineScreen } from '@/features/check-ins/TodayRoutineScreen';
import { completeCheckIn } from '@/features/check-ins/services/checkInService';
import { loadCurrentDailyStreak } from '@/features/streaks/services/dailyStreakService';
import { i18n } from '@/i18n';
import type { Database } from '@/lib/supabase/database.types';
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
        syncStatus: null,
        title: 'Morning walk',
      },
    ]),
  ),
  undoCheckIn: jest.fn(() => Promise.resolve()),
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

jest.mock('@/features/streaks/services/dailyStreakService', () => ({
  loadCurrentDailyStreak: jest.fn(() => Promise.resolve(2)),
}));

const mockedLoadCurrentDailyStreak = loadCurrentDailyStreak as jest.MockedFunction<
  typeof loadCurrentDailyStreak
>;

describe('TodayRoutineScreen', () => {
  beforeEach(() => {
    mockedLoadCurrentDailyStreak.mockClear();
  });

  it('optimistically completes a routine item and sends its idempotency key', async () => {
    await i18n.changeLanguage('en');
    const onRoutineCompletionChanged = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineScreen
          client={{} as SupabaseClient<Database>}
          displayName="Jamie"
          hasPlanCreationSuccess={false}
          hasSignOutError={false}
          onCreatePlan={jest.fn()}
          onEditRoutine={jest.fn()}
          onOpenPlans={jest.fn()}
          onRoutineCompletionChanged={onRoutineCompletionChanged}
          onSignOut={jest.fn()}
          routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
          userId="user-1"
        />
      </ThemeProvider>,
    );

    await screen.findByRole('button', { name: 'Complete Morning walk' });
    await fireEvent.press(
      screen.getByRole('button', { name: 'Complete Morning walk' }),
    );

    await waitFor(() => {
      expect(screen.getAllByText('1 of 1 complete')).not.toHaveLength(0);
      expect(screen.getByText('3 days')).toBeTruthy();
      expect(screen.getByText('Everything for today is complete!')).toBeTruthy();
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

  it('keeps today routines available when the daily streak summary cannot load', async () => {
    await i18n.changeLanguage('en');
    mockedLoadCurrentDailyStreak.mockRejectedValueOnce(
      new Error('DAILY_STREAK_LOAD_FAILED'),
    );

    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineScreen
          client={{} as SupabaseClient<Database>}
          displayName="Jamie"
          hasPlanCreationSuccess={false}
          hasSignOutError={false}
          onCreatePlan={jest.fn()}
          onEditRoutine={jest.fn()}
          onOpenPlans={jest.fn()}
          onRoutineCompletionChanged={jest.fn()}
          onSignOut={jest.fn()}
          routineDayConfig={{ dayStartMinute: 0, timeZone: 'UTC' }}
          userId="user-1"
        />
      </ThemeProvider>,
    );

    expect(
      await screen.findByRole('button', { name: 'Complete Morning walk' }),
    ).toBeTruthy();
    expect(screen.getByText('Unavailable')).toBeTruthy();
    expect(
      screen.queryByText(
        'We couldn’t load or save your routine right now. Please try again.',
      ),
    ).toBeNull();
  });
});
