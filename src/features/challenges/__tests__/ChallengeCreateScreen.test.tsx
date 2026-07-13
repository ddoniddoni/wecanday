import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ChallengeCreateScreen } from '@/features/challenges/ChallengeCreateScreen';
import { createOneToOneChallenge } from '@/features/challenges/services/challengeService';
import { loadFriendConnections } from '@/features/friends/services/friendConnectionService';
import { i18n } from '@/i18n';
import type { Database } from '@/lib/supabase/database.types';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/challenges/services/challengeService', () => ({
  createOneToOneChallenge: jest.fn(),
}));
jest.mock('@/features/friends/services/friendConnectionService', () => ({
  loadFriendConnections: jest.fn(),
}));

const mockedCreateOneToOneChallenge = createOneToOneChallenge as jest.MockedFunction<typeof createOneToOneChallenge>;
const mockedLoadFriendConnections = loadFriendConnections as jest.MockedFunction<typeof loadFriendConnections>;
const client = {} as SupabaseClient<Database>;

describe('ChallengeCreateScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockedCreateOneToOneChallenge.mockReset();
    mockedLoadFriendConnections.mockReset();
  });

  it('creates an invitation with the selected friend and schedule', async () => {
    mockedLoadFriendConnections.mockResolvedValue({
      blockedUsers: [],
      friends: [{ avatar_seed: 'seed-a', display_name: 'Friend A', id: 'friend-1' }],
    });
    mockedCreateOneToOneChallenge.mockResolvedValue({} as Awaited<ReturnType<typeof createOneToOneChallenge>>);
    const onComplete = jest.fn();
    const screen = await render(
      <ThemeProvider preference="light">
        <ChallengeCreateScreen client={client} initialStartsOn="2026-07-14" onBack={jest.fn()} onComplete={onComplete} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Friend A')).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole('radio', { name: 'Select Friend A for this challenge' }));
    await fireEvent.changeText(screen.getByLabelText('Challenge title'), 'Morning walk');
    await fireEvent.press(screen.getByRole('button', { name: 'Send challenge invitation' }));

    await waitFor(() => {
      expect(mockedCreateOneToOneChallenge).toHaveBeenCalledWith(client, {
        endsOn: '2026-07-20',
        friendId: 'friend-1',
        scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6],
        startsOn: '2026-07-14',
        title: 'Morning walk',
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
