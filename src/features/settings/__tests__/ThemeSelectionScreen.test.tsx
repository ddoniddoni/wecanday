import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ThemeSelectionScreen } from '@/features/settings/ThemeSelectionScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('ThemeSelectionScreen', () => {
  it('saves the selected theme and applies it immediately', async () => {
    await i18n.changeLanguage('en');
    const onSave = jest.fn(() => Promise.resolve());
    const screen = await render(
      <ThemeProvider preference="light">
        <ThemeSelectionScreen onBack={jest.fn()} onSave={onSave} />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('dark');
      expect(screen.getByRole('radio', { name: 'Dark' }).props.accessibilityState).toEqual(
        expect.objectContaining({ checked: true }),
      );
    });
  });

  it('restores the previous theme when saving fails', async () => {
    await i18n.changeLanguage('en');
    const screen = await render(
      <ThemeProvider preference="light">
        <ThemeSelectionScreen onBack={jest.fn()} onSave={() => Promise.reject(new Error('NETWORK'))} />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't save your theme. Please try again.",
    );
    expect(screen.getByRole('radio', { name: 'Light' }).props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    );
  });
});
