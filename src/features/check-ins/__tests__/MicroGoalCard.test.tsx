import { fireEvent, render } from '@testing-library/react-native';

import { MicroGoalCard } from '@/features/check-ins/MicroGoalCard';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('MicroGoalCard', () => {
  it('guides the user to an incomplete routine without completing it', async () => {
    await i18n.changeLanguage('en');
    const onOpenRoutine = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <MicroGoalCard item={{ title: 'Morning walk' }} onOpenRoutine={onOpenRoutine} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Morning walk')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Open Morning walk' }));

    expect(onOpenRoutine).toHaveBeenCalledTimes(1);
  });

  it('celebrates when there is no remaining routine', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <MicroGoalCard item={null} onOpenRoutine={jest.fn()} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Your one thing is done!')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
