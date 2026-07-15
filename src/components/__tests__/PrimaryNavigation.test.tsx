import { fireEvent, render } from '@testing-library/react-native';

import { PrimaryNavigation } from '@/components/PrimaryNavigation';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('PrimaryNavigation', () => {
  it('shows the active destination and opens the selected destination', async () => {
    await i18n.changeLanguage('en');
    const onOpenCommunity = jest.fn();
    const onOpenPlans = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <PrimaryNavigation
          activeTab="today"
          onOpenCommunity={onOpenCommunity}
          onOpenPlans={onOpenPlans}
          onOpenProfile={jest.fn()}
          onOpenStatistics={jest.fn()}
          onOpenToday={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('tab', { name: 'Today' }).props.accessibilityState).toEqual({
      selected: true,
    });

    await fireEvent.press(screen.getByRole('tab', { name: 'Plans' }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Community' }));

    expect(onOpenPlans).toHaveBeenCalledTimes(1);
    expect(onOpenCommunity).toHaveBeenCalledTimes(1);
  });
});
