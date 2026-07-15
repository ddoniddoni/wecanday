import { fireEvent, render } from '@testing-library/react-native';

import { ProfileOverviewScreen } from '@/features/profile/ProfileOverviewScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('ProfileOverviewScreen', () => {
  it('offers compact icon actions in the profile space', async () => {
    await i18n.changeLanguage('en');
    const onOpenThemes = jest.fn();
    const onOpenLanguageSelection = jest.fn();
    const onOpenAccountSettings = jest.fn();
    const onOpenCompanionSelection = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <ProfileOverviewScreen
          companionId="sprout"
          createdAt="2026-07-01T00:00:00.000Z"
          displayName="Jamie"
          onOpenAccountSettings={onOpenAccountSettings}
          onOpenCompanionSelection={onOpenCompanionSelection}
          onOpenFriendSearch={jest.fn()}
          onOpenLanguageSelection={onOpenLanguageSelection}
          onOpenPremium={jest.fn()}
          onOpenPlans={jest.fn()}
          onOpenStatistics={jest.fn()}
          onOpenThemes={onOpenThemes}
          onOpenToday={jest.fn()}
          publicCode="Ab7kL2xP9Qm4"
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('header', { name: 'Jamie' })).toBeTruthy();
    expect(screen.getByText('Ab7kL2xP9Qm4')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Change theme' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Change language' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Open settings' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Change pet' }));

    expect(screen.getByText('Pet')).toBeTruthy();
    expect(screen.getByText('Language')).toBeTruthy();
    expect(screen.getByText('Theme')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();

    expect(onOpenThemes).toHaveBeenCalledTimes(1);
    expect(onOpenLanguageSelection).toHaveBeenCalledTimes(1);
    expect(onOpenAccountSettings).toHaveBeenCalledTimes(1);
    expect(onOpenCompanionSelection).toHaveBeenCalledTimes(1);
  });
});
