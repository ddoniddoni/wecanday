import * as Clipboard from 'expo-clipboard';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';

import { PublicCodeShareCard } from '@/features/friends/PublicCodeShareCard';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

const mockedSetStringAsync = Clipboard.setStringAsync as jest.MockedFunction<
  typeof Clipboard.setStringAsync
>;

describe('PublicCodeShareCard', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockedSetStringAsync.mockReset();
    jest.spyOn(Share, 'share').mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('copies only the exact public code', async () => {
    mockedSetStringAsync.mockResolvedValue(true);
    const screen = await renderCard();

    await fireEvent.press(screen.getByRole('button', { name: 'Copy code' }));

    await waitFor(() => {
      expect(mockedSetStringAsync).toHaveBeenCalledWith('Ab7kL2xP9Qm4');
      expect(screen.getByText('Friend code copied.')).toBeTruthy();
    });
  });

  it('opens the system share sheet with the public code only', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    const screen = await renderCard();

    await fireEvent.press(screen.getByRole('button', { name: 'Share code' }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(
        {
          message: 'My WeCanDay friend code is Ab7kL2xP9Qm4',
          title: 'My WeCanDay friend code',
        },
        { dialogTitle: 'My WeCanDay friend code' },
      );
    });
  });
});

function renderCard() {
  return render(
    <ThemeProvider preference="light">
      <PublicCodeShareCard publicCode="Ab7kL2xP9Qm4" />
    </ThemeProvider>,
  );
}
