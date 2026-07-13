import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { FriendCodeSearchScreen } from '@/features/friends/FriendCodeSearchScreen';
import { lookupFriendByPublicCode } from '@/features/friends/services/friendSearchService';
import type { Database } from '@/lib/supabase/database.types';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/friends/services/friendSearchService', () => ({
  lookupFriendByPublicCode: jest.fn(),
}));

const mockedLookupFriendByPublicCode = lookupFriendByPublicCode as jest.MockedFunction<
  typeof lookupFriendByPublicCode
>;
const client = {} as SupabaseClient<Database>;

describe('FriendCodeSearchScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockedLookupFriendByPublicCode.mockReset();
  });

  it('stops malformed codes and then shows only the minimal profile returned by the RPC', async () => {
    mockedLookupFriendByPublicCode.mockResolvedValue({
      avatar_seed: 'avatar-seed',
      display_name: 'Friend Name',
      id: '00000000-0000-0000-0000-000000000001',
    });
    const screen = await renderSearchScreen();

    await fireEvent.changeText(screen.getByLabelText('Friend code'), 'short');
    await fireEvent.press(screen.getByRole('button', { name: 'Search code' }));

    expect(screen.getByText('Enter the complete 12-character friend code.')).toBeTruthy();
    expect(mockedLookupFriendByPublicCode).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Friend code'), 'Ab7kL2xP9Qm4');
    await fireEvent.press(screen.getByRole('button', { name: 'Search code' }));

    await waitFor(() => {
      expect(mockedLookupFriendByPublicCode).toHaveBeenCalledWith(client, 'Ab7kL2xP9Qm4');
      expect(screen.getByText('Friend Name')).toBeTruthy();
      expect(screen.getByText('Avatar preview: avatar-seed')).toBeTruthy();
    });
  });
});

async function renderSearchScreen() {
  return render(
    <ThemeProvider preference="light">
      <FriendCodeSearchScreen client={client} onBack={jest.fn()} onOpenRequests={jest.fn()} />
    </ThemeProvider>,
  );
}
