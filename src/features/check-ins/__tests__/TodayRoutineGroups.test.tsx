import { render } from '@testing-library/react-native';

import { TodayRoutineGroups } from '@/features/check-ins/TodayRoutineGroups';
import type { TodayRoutineGroup } from '@/features/check-ins/domain/todayRoutines';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

const longRoutineTitle = 'Prepare a detailed routine title that stays readable when it reaches the maximum supported length';

describe('TodayRoutineGroups', () => {
  it('keeps long routine names and many routine controls available to assistive technology', async () => {
    await i18n.changeLanguage('en');
    const groups: TodayRoutineGroup[] = [
      {
        key: 'morning',
        items: Array.from({ length: 8 }, (_, index) => ({
          completedAt: index === 0 ? '2026-07-14T01:00:00.000Z' : null,
          id: `routine-${index}`,
          reminder_minute: 420 + index * 15,
          schedule_weekdays: [2],
          sort_order: index,
          syncStatus: null,
          title: index === 7 ? longRoutineTitle : `Routine ${index + 1}`,
        })),
      },
    ];
    const screen = await render(
      <ThemeProvider preference="light">
        <TodayRoutineGroups
          groups={groups}
          isReadOnly={false}
          mutatingRoutineIds={new Set()}
          nextRoutineId="routine-1"
          onEditRoutine={jest.fn()}
          onStartRoutine={jest.fn()}
          onToggleRoutine={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('checkbox', { name: 'Undo Routine 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Routine 2' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: `Complete ${longRoutineTitle}` })).toBeTruthy();
    expect(screen.getByText(longRoutineTitle).props.numberOfLines).toBe(2);
  });
});
