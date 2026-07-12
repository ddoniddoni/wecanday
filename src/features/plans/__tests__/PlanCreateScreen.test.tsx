import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PlanCreateScreen } from '@/features/plans/PlanCreateScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('PlanCreateScreen', () => {
  it('creates a plan and routine with the selected weekdays', async () => {
    await i18n.changeLanguage('en');
    const onComplete = jest.fn();
    const onSave = jest.fn<
      Promise<void>,
      [
        {
          planTitle: string;
          routineTitle: string;
          scheduleWeekdays: number[];
        },
      ]
    >(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <PlanCreateScreen onComplete={onComplete} onSave={onSave} />
      </ThemeProvider>,
    );

    await fireEvent.changeText(
      screen.getByLabelText('Plan title'),
      'Read more books',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Today’s action'),
      'Read one chapter',
    );
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Sun' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Create routine' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        planTitle: 'Read more books',
        routineTitle: 'Read one chapter',
        scheduleWeekdays: [1, 2, 3, 4, 5, 6],
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
