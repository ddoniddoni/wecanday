import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { OnboardingFlowScreen } from '@/features/onboarding/OnboardingFlowScreen';
import { defaultOnboardingPreferences } from '@/features/onboarding/domain/preferences';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('OnboardingFlowScreen', () => {
  it('keeps country independent while changing language to Korean', async () => {
    await i18n.changeLanguage('en');
    const persistPreferences = jest.fn().mockResolvedValue(undefined);
    const onComplete = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <OnboardingFlowScreen
          initialPreferences={defaultOnboardingPreferences}
          onComplete={onComplete}
          persistPreferences={persistPreferences}
        />
      </ThemeProvider>,
    );

    await fireEvent.changeText(
      screen.getByLabelText('Search countries'),
      'South Korea',
    );
    await fireEvent.press(
      await screen.findByLabelText('Select South Korea (KR)'),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Continue' }),
    );

    expect(await screen.findByText('What is your primary language?')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Use 한국어'));
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('안녕하세요, 우리 할 수 있어요'),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: '시작하기' }),
    );

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith({
      version: 1,
      countryCode: 'KR',
      locale: 'ko',
      isComplete: true,
    });
  });
});
