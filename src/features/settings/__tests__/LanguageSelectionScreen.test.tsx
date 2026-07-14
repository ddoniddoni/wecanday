import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { LanguageSelectionScreen } from '@/features/settings/LanguageSelectionScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('LanguageSelectionScreen', () => {
  it('changes the app language immediately and saves the account preference', async () => {
    await i18n.changeLanguage('ko');
    const onSave = jest.fn(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <LanguageSelectionScreen onBack={jest.fn()} onSave={onSave} />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('en');
      expect(i18n.resolvedLanguage).toBe('en');
      expect(screen.getByRole('header', { name: 'Choose your language' })).toBeTruthy();
    });
  });

  it('restores the previous language when saving fails', async () => {
    await i18n.changeLanguage('ko');
    const screen = await render(
      <ThemeProvider preference="light">
        <LanguageSelectionScreen onBack={jest.fn()} onSave={() => Promise.reject(new Error('NETWORK'))} />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));

    await waitFor(() => {
      expect(i18n.resolvedLanguage).toBe('ko');
      expect(screen.getByRole('alert')).toHaveTextContent('언어를 저장하지 못했어요. 다시 시도해 주세요.');
    });
  });
});
