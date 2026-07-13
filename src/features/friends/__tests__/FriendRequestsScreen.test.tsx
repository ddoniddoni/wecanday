import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { FriendRequestsScreen } from '@/features/friends/FriendRequestsScreen';
import {
  loadPendingFriendRequests,
  respondToFriendRequest,
} from '@/features/friends/services/friendRequestService';
import type { Database } from '@/lib/supabase/database.types';
import { i18n } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/friends/services/friendRequestService', () => ({
  cancelFriendRequest: jest.fn(),
  loadPendingFriendRequests: jest.fn(),
  respondToFriendRequest: jest.fn(),
}));

const mockedLoadPendingFriendRequests = loadPendingFriendRequests as jest.MockedFunction<
  typeof loadPendingFriendRequests
>;
const mockedRespondToFriendRequest = respondToFriendRequest as jest.MockedFunction<
  typeof respondToFriendRequest
>;
const client = {} as SupabaseClient<Database>;

describe('FriendRequestsScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockedLoadPendingFriendRequests.mockReset();
    mockedRespondToFriendRequest.mockReset();
  });

  it('shows an incoming request and accepts it through the server mutation', async () => {
    mockedLoadPendingFriendRequests
      .mockResolvedValueOnce([
        {
          avatar_seed: 'seed-a',
          direction: 'incoming',
          display_name: 'Friend A',
          id: '00000000-0000-0000-0000-000000000001',
        },
      ])
      .mockResolvedValueOnce([]);
    mockedRespondToFriendRequest.mockResolvedValue();
    const screen = await renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Friend A')).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => {
      expect(mockedRespondToFriendRequest).toHaveBeenCalledWith(
        client,
        '00000000-0000-0000-0000-000000000001',
        'accepted',
      );
      expect(screen.getByText('No pending friend requests right now.')).toBeTruthy();
    });
  });
});

function renderScreen() {
  return render(
    <ThemeProvider preference="light">
      <FriendRequestsScreen client={client} onBack={jest.fn()} />
    </ThemeProvider>,
  );
}
