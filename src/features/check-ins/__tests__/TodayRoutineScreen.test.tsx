import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { TodayRoutineScreen } from '@/features/check-ins/TodayRoutineScreen';
import { completeCheckIn } from '@/features/check-ins/services/checkInService';
import { playRoutineCompletionHaptic } from '@/features/check-ins/services/completionHaptics';
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

describe('TodayRoutineScreen', () => {
  it('optimistically completes a routine item and sends its idempotency key', async () => {
    await i18n.changeLanguage('en');
    const onRoutineCompletionChanged = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineScreen
          client={{} as SupabaseClient<Database>}
          companionId="sprout"
          displayName="Jamie"
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

    await screen.findByRole('button', { name: 'Complete Morning walk' });
    await fireEvent.press(
      screen.getByRole('button', { name: 'Complete Morning walk' }),
    );

    await waitFor(() => {
      expect(screen.getByText('1 of 1 complete')).toBeTruthy();
      expect(screen.getByText('Everything for today is complete!')).toBeTruthy();
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
          displayName="Jamie"
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

    await screen.findByRole('button', { name: 'Complete Morning walk' });
    await fireEvent.press(screen.getByRole('button', { name: 'Complete Morning walk' }));

    await waitFor(() => {
      expect(playRoutineCompletionHaptic).toHaveBeenCalledWith({
        isEnabled: true,
        shouldReduceMotion: true,
      });
    });
  });

});
