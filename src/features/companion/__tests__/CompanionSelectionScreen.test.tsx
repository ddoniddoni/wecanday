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

    await fireEvent.press(screen.getByRole('button', { name: 'Choose Dew' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Choose this companion' }),
    );

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('dew'));
  });
});
