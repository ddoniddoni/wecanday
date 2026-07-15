import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { CompanionSelectionScreen } from '@/features/companion/CompanionSelectionScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('CompanionSelectionScreen', () => {
  it('saves the companion selected by the user', async () => {
    await i18n.changeLanguage('en');
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = await render(
      <ThemeProvider preference="light">
        <CompanionSelectionScreen onSave={onSave} />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Choose Luna' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Choose this pet' }),
    );

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('luna'));
  });

  it('returns to the previous screen after a successful save', async () => {
    await i18n.changeLanguage('en');
    const onBack = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <CompanionSelectionScreen onBack={onBack} onSave={jest.fn().mockResolvedValue(undefined)} />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Choose this pet' }));

    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
  });
});
