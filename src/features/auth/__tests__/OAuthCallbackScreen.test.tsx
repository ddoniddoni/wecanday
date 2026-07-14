import type { ComponentProps } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { OAuthCallbackScreen } from '@/features/auth/OAuthCallbackScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

async function renderScreen(
  props: Partial<ComponentProps<typeof OAuthCallbackScreen>> = {},
) {
  await i18n.changeLanguage('en');

  return render(
    <ThemeProvider preference="light">
      <OAuthCallbackScreen
        code="authorization-code"
        exchangeCode={jest.fn().mockResolvedValue(undefined)}
        onComplete={jest.fn()}
        onReturnToSignIn={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe('OAuthCallbackScreen', () => {
  it('exchanges a callback code and returns to the app', async () => {
    const exchangeCode = jest.fn().mockResolvedValue(undefined);
    const onComplete = jest.fn();

    await renderScreen({ exchangeCode, onComplete });

    await waitFor(() => {
      expect(exchangeCode).toHaveBeenCalledWith('authorization-code');
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('shows a safe retry path when the callback is missing', async () => {
    const onReturnToSignIn = jest.fn();
    const screen = await renderScreen({ code: null, onReturnToSignIn });

    fireEvent.press(screen.getByRole('button'));

    expect(onReturnToSignIn).toHaveBeenCalledTimes(1);
  });

  it('does not update or complete after the callback screen unmounts', async () => {
    let rejectExchange: (reason?: unknown) => void = () => undefined;
    const exchangeCode = jest.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectExchange = reject;
        }),
    );
    const onComplete = jest.fn();
    const screen = await renderScreen({ exchangeCode, onComplete });

    screen.unmount();
    rejectExchange(new Error('exchange failed'));

    await Promise.resolve();

    expect(onComplete).not.toHaveBeenCalled();
  });
});
