import { fireEvent, render } from '@testing-library/react-native';

import { LegalDocumentScreen } from '@/features/legal/LegalDocumentScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('LegalDocumentScreen', () => {
  it('shows the privacy policy data-deletion information', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <LegalDocumentScreen document="privacy" onBack={jest.fn()} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('header', { name: 'Privacy policy' })).toBeTruthy();
    expect(screen.getByText('Your choices and deletion')).toBeTruthy();
    expect(screen.getByText(/You can start permanent account deletion/)).toBeTruthy();
  });

  it('shows the terms and returns to the previous screen', async () => {
    await i18n.changeLanguage('en');
    const onBack = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <LegalDocumentScreen document="terms" onBack={onBack} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('header', { name: 'Terms of service' })).toBeTruthy();
    expect(screen.getByText('Subscriptions')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
