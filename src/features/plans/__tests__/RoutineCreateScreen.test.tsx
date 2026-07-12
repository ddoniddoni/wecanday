import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { RoutineCreateScreen } from '@/features/plans/RoutineCreateScreen';
import { PlanDomainError } from '@/features/plans/domain/planErrors';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('RoutineCreateScreen', () => {
  it('adds a routine to the selected plan with selected weekdays', async () => {
    await i18n.changeLanguage('en');
    const onComplete = jest.fn();
    const onSave = jest.fn<
      Promise<void>,
      [{ routineTitle: string; scheduleWeekdays: number[] }]
    >(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineCreateScreen
          onBack={jest.fn()}
          onComplete={onComplete}
          onSave={onSave}
          planTitle="Read more books"
        />
      </ThemeProvider>,
    );

    await fireEvent.changeText(screen.getByLabelText('Today’s action'), 'Read two chapters');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Sun' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add routine' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        reminderMinute: null,
        routineTitle: 'Read two chapters',
        scheduleWeekdays: [1, 2, 3, 4, 5, 6],
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the server free-limit message', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineCreateScreen
          onBack={jest.fn()}
          onComplete={jest.fn()}
          onSave={() => Promise.reject(new PlanDomainError('ROUTINE_LIMIT_REACHED'))}
          planTitle="Read more books"
        />
      </ThemeProvider>,
    );

    await fireEvent.changeText(screen.getByLabelText('Today’s action'), 'Read two chapters');
    await fireEvent.press(screen.getByRole('button', { name: 'Add routine' }));

    await screen.findByRole('alert');

    expect(screen.getByText('Free accounts can have up to four active routines.')).toBeTruthy();
  });

  it('saves edited title and weekdays', async () => {
    await i18n.changeLanguage('en');
    const onComplete = jest.fn();
    const onSave = jest.fn<
      Promise<void>,
      [{ routineTitle: string; scheduleWeekdays: number[] }]
    >(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineCreateScreen
          initialRoutineTitle="Morning walk"
          initialScheduleWeekdays={[1, 3]}
          mode="edit"
          onBack={jest.fn()}
          onComplete={onComplete}
          onSave={onSave}
          planTitle=""
        />
      </ThemeProvider>,
    );

    await fireEvent.changeText(screen.getByLabelText('Today’s action'), 'Walk the dog');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        reminderMinute: null,
        routineTitle: 'Walk the dog',
        scheduleWeekdays: [1, 3],
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('saves an optional reminder time as minutes after midnight', async () => {
    await i18n.changeLanguage('en');
    const onSave = jest.fn<Promise<void>, [{ reminderMinute: number | null; routineTitle: string; scheduleWeekdays: number[] }]>(() => Promise.resolve());
    const screen = await render(<ThemeProvider preference="light"><RoutineCreateScreen onBack={jest.fn()} onComplete={jest.fn()} onSave={onSave} planTitle="Read" /></ThemeProvider>);
    await fireEvent.changeText(screen.getByLabelText('Today’s action'), 'Read');
    await fireEvent.changeText(screen.getByLabelText('Reminder time'), '09:30');
    await fireEvent.press(screen.getByRole('button', { name: 'Add routine' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ reminderMinute: 570, routineTitle: 'Read', scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6] }));
  });

  it('pauses an active routine independently from its title and weekdays', async () => {
    await i18n.changeLanguage('en');
    const onChangeStatus = jest.fn<Promise<void>, ['active' | 'paused']>(() => Promise.resolve());
    const onComplete = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineCreateScreen
          initialRoutineTitle="Morning walk"
          mode="edit"
          onBack={jest.fn()}
          onChangeStatus={onChangeStatus}
          onComplete={onComplete}
          onSave={() => Promise.resolve()}
          planTitle=""
          routineStatus="active"
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Pause routine' }));

    await waitFor(() => {
      expect(onChangeStatus).toHaveBeenCalledWith('paused');
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the server free-limit message when resuming a routine', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineCreateScreen
          mode="edit"
          onBack={jest.fn()}
          onChangeStatus={() => Promise.reject(new PlanDomainError('ROUTINE_LIMIT_REACHED'))}
          onComplete={jest.fn()}
          onSave={() => Promise.resolve()}
          planTitle=""
          routineStatus="paused"
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Resume routine' }));

    await screen.findByRole('alert');

    expect(screen.getByText('Free accounts can have up to four active routines.')).toBeTruthy();
  });

  it('requires confirmation before archiving a routine', async () => {
    await i18n.changeLanguage('en');
    const onArchive = jest.fn<Promise<void>, []>(() => Promise.resolve());
    const onComplete = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <RoutineCreateScreen
          mode="edit"
          onArchive={onArchive}
          onBack={jest.fn()}
          onComplete={onComplete}
          onSave={() => Promise.resolve()}
          planTitle=""
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Archive routine' }));
    expect(screen.getByText('Archive this routine?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => {
      expect(onArchive).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
