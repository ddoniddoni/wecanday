import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PlanListScreen } from '@/features/plans/PlanListScreen';
import { PlanDomainError } from '@/features/plans/domain/planErrors';
import { loadPlans } from '@/features/plans/services/planService';
import { i18n } from '@/i18n';
import type { Database } from '@/lib/supabase/database.types';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/plans/services/planService', () => ({
  loadPlans: jest.fn(),
}));

const mockedLoadPlans = loadPlans as jest.MockedFunction<typeof loadPlans>;
const client = {} as SupabaseClient<Database>;

describe('PlanListScreen', () => {
  beforeEach(() => {
    mockedLoadPlans.mockReset();
  });

  it('shows only the loaded plans with their statuses', async () => {
    await i18n.changeLanguage('en');
    mockedLoadPlans.mockResolvedValue([
      {
        ends_on: null,
        activeRoutineCount: 2,
        id: 'plan-active',
        routineItems: [
          {
            id: 'routine-active',
            schedule_weekdays: [1, 2, 3],
            status: 'active',
            title: 'Read one chapter',
          },
        ],
        starts_on: '2026-07-12',
        status: 'active',
        title: 'Read every day',
      },
      {
        ends_on: null,
        activeRoutineCount: 0,
        id: 'plan-paused',
        routineItems: [
          {
            id: 'routine-paused',
            schedule_weekdays: [4],
            status: 'paused',
            title: 'Practice scales',
          },
        ],
        starts_on: '2026-07-12',
        status: 'paused',
        title: 'Practice guitar',
      },
      {
        ends_on: null,
        activeRoutineCount: 1,
        id: 'plan-archived',
        routineItems: [],
        starts_on: '2026-07-12',
        status: 'archived',
        title: 'Past challenge',
      },
    ]);
    const onBack = jest.fn();
    const onAddRoutine = jest.fn();
    const onEditRoutine = jest.fn();
    const onArchivePlan = jest.fn(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <PlanListScreen
          client={client}
          onAddRoutine={onAddRoutine}
        onBack={onBack}
        onArchivePlan={onArchivePlan}
        onCreatePlan={jest.fn()}
        onEditRoutine={onEditRoutine}
        />
      </ThemeProvider>,
    );

    await screen.findByText('Read every day');

    expect(screen.getByLabelText('Read every day, Active plan, 2 active routines')).toBeTruthy();
    expect(screen.getByLabelText('Practice guitar, Paused plan, 0 active routines')).toBeTruthy();
    expect(screen.getByLabelText('Past challenge, Archived plan, 1 active routine')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Add a routine to Read every day' }));

    expect(onAddRoutine).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'plan-active' }),
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Edit Practice scales, Paused' }));

    expect(onEditRoutine).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'plan-paused' }),
      expect.objectContaining({ id: 'routine-paused', status: 'paused' }),
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Archive Read every day' }));
    expect(screen.getByText('Archive this plan?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => {
      expect(onArchivePlan).toHaveBeenCalledWith('plan-active');
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Back to today' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('offers a retry after a recoverable loading error', async () => {
    await i18n.changeLanguage('en');
    mockedLoadPlans
      .mockRejectedValueOnce(new PlanDomainError('PLAN_LIST_FAILED'))
      .mockResolvedValueOnce([]);
    const screen = await render(
      <ThemeProvider preference="light">
        <PlanListScreen
          client={client}
          onAddRoutine={jest.fn()}
          onBack={jest.fn()}
          onArchivePlan={() => Promise.resolve()}
          onCreatePlan={jest.fn()}
          onEditRoutine={jest.fn()}
        />
      </ThemeProvider>,
    );

    await screen.findByRole('alert');
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(screen.getByText("You don't have a plan yet")).toBeTruthy();
      expect(mockedLoadPlans).toHaveBeenCalledTimes(2);
    });
  });
});
