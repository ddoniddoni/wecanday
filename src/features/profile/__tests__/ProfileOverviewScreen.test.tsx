import { fireEvent, render } from '@testing-library/react-native';

import { ProfileOverviewScreen } from '@/features/profile/ProfileOverviewScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('ProfileOverviewScreen', () => {
  it('keeps account information in a dedicated profile space', async () => {
    await i18n.changeLanguage('en');
    const onOpenThemes = jest.fn();
    const onOpenLanguageSelection = jest.fn();
    const onOpenAccountSettings = jest.fn();
    const onOpenCompanionSelection = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <ProfileOverviewScreen
          displayName="Jamie"
          onOpenAccountSettings={onOpenAccountSettings}
          onOpenCompanionSelection={onOpenCompanionSelection}
          onOpenFriendSearch={jest.fn()}
          onOpenLanguageSelection={onOpenLanguageSelection}
          onOpenPlans={jest.fn()}
          onOpenStatistics={jest.fn()}
          onOpenThemes={onOpenThemes}
          onOpenToday={jest.fn()}
          publicCode="Ab7kL2xP9Qm4"
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('header', { name: "Jamie's space" })).toBeTruthy();
    expect(screen.getByText('Ab7kL2xP9Qm4')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Change theme' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Change language' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Open settings' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Change companion' }));

    expect(onOpenThemes).toHaveBeenCalledTimes(1);
    expect(onOpenLanguageSelection).toHaveBeenCalledTimes(1);
    expect(onOpenAccountSettings).toHaveBeenCalledTimes(1);
    expect(onOpenCompanionSelection).toHaveBeenCalledTimes(1);
  });
});
