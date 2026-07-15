import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { NicknameSetupScreen } from '@/features/auth/NicknameSetupScreen';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('NicknameSetupScreen', () => {
  it('confirms a trimmed nickname before continuing', async () => {
    await i18n.changeLanguage('en');
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = await render(
      <ThemeProvider preference="light">
        <NicknameSetupScreen initialDisplayName="Jamie" onBack={jest.fn()} onSave={onSave} />
      </ThemeProvider>,
    );

    await fireEvent.changeText(screen.getByLabelText('Nickname'), '  River  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('River'));
  });
});
