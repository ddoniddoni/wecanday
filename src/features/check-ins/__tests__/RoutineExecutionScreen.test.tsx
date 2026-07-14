import { fireEvent, render } from '@testing-library/react-native';

import { RoutineExecutionScreen } from '@/features/check-ins/RoutineExecutionScreen';
import type { TodayRoutineItem } from '@/features/check-ins/domain/todayRoutines';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

const routineItems: TodayRoutineItem[] = [
  {
    completedAt: null,
    id: 'routine-1',
    reminder_minute: 480,
    schedule_weekdays: [1],
    sort_order: 0,
    syncStatus: null,
    title: 'Morning walk',
  },
  {
    completedAt: null,
    id: 'routine-2',
    reminder_minute: 600,
    schedule_weekdays: [1],
    sort_order: 1,
    syncStatus: null,
    title: 'Read a book',
  },
];

describe('RoutineExecutionScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('keeps the current routine focused and previews the next routine', async () => {
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineExecutionScreen
          initialRoutineId="routine-1"
          items={routineItems}
          mutatingRoutineIds={new Set()}
          onBack={jest.fn()}
          onCompleteRoutine={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Morning walk')).toBeTruthy();
    expect(screen.getByText('Read a book')).toBeTruthy();
    expect(screen.getByLabelText('15:00 remaining in this focus session')).toBeTruthy();
  });

  it('can pause the session and move the current focus without changing completion', async () => {
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineExecutionScreen
          initialRoutineId="routine-1"
          items={routineItems}
          mutatingRoutineIds={new Set()}
          onBack={jest.fn()}
          onCompleteRoutine={jest.fn()}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    expect(await screen.findByRole('button', { name: 'Resume' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Move Morning walk to later and view the next routine' }));

    expect(screen.getByText('Read a book')).toBeTruthy();
    expect(screen.getByText('This is your last routine for today.')).toBeTruthy();
  });

  it('uses the established completion callback', async () => {
    const onCompleteRoutine = jest.fn().mockResolvedValue(undefined);
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineExecutionScreen
          initialRoutineId="routine-1"
          items={routineItems}
          mutatingRoutineIds={new Set()}
          onBack={jest.fn()}
          onCompleteRoutine={onCompleteRoutine}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Complete Morning walk' }));
    expect(onCompleteRoutine).toHaveBeenCalledWith(routineItems[0]);
  });

  it('shows an all-complete state and keeps a single remaining routine from being skipped', async () => {
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineExecutionScreen
          initialRoutineId="routine-1"
          items={routineItems.map((item) => ({ ...item, completedAt: '2026-07-14T01:00:00.000Z' }))}
          mutatingRoutineIds={new Set()}
          onBack={jest.fn()}
          onCompleteRoutine={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Everything is complete')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Return to today’s routines' })).toBeTruthy();

    await screen.rerender(
      <ThemeProvider preference="light">
        <RoutineExecutionScreen
          initialRoutineId="routine-1"
          items={[routineItems[0]]}
          mutatingRoutineIds={new Set()}
          onBack={jest.fn()}
          onCompleteRoutine={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('button', { name: 'Move Morning walk to later and view the next routine' }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });
});
