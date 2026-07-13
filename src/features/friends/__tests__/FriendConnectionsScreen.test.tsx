import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { FriendConnectionsScreen } from '@/features/friends/FriendConnectionsScreen';
import {
  loadFriendConnections,
  removeFriend,
} from '@/features/friends/services/friendConnectionService';
import type { Database } from '@/lib/supabase/database.types';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/friends/services/friendConnectionService', () => ({
  blockUser: jest.fn(),
  loadFriendConnections: jest.fn(),
  removeFriend: jest.fn(),
  unblockUser: jest.fn(),
}));

const mockedLoadFriendConnections = loadFriendConnections as jest.MockedFunction<
  typeof loadFriendConnections
>;
const mockedRemoveFriend = removeFriend as jest.MockedFunction<typeof removeFriend>;
const client = {} as SupabaseClient<Database>;

describe('FriendConnectionsScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockedLoadFriendConnections.mockReset();
    mockedRemoveFriend.mockReset();
  });

  it('removes a friend through the server mutation and refreshes the list', async () => {
    mockedLoadFriendConnections
      .mockResolvedValueOnce({
        blockedUsers: [],
        friends: [
          {
            avatar_seed: 'seed-a',
            display_name: 'Friend A',
            id: '00000000-0000-0000-0000-000000000001',
          },
        ],
      })
      .mockResolvedValueOnce({ blockedUsers: [], friends: [] });
    mockedRemoveFriend.mockResolvedValue();
    const screen = await renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Friend A')).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Remove friend' }));

    await waitFor(() => {
      expect(mockedRemoveFriend).toHaveBeenCalledWith(
        client,
        '00000000-0000-0000-0000-000000000001',
      );
      expect(screen.getByText('You don’t have any friends yet.')).toBeTruthy();
    });
  });
});

function renderScreen() {
  return render(
    <ThemeProvider preference="light">
      <FriendConnectionsScreen client={client} onBack={jest.fn()} />
    </ThemeProvider>,
  );
}
