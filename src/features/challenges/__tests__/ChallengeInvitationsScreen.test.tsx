import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ChallengeInvitationsScreen } from '@/features/challenges/ChallengeInvitationsScreen';
import {
  loadChallengeInvitations,
  respondToChallengeInvitation,
} from '@/features/challenges/services/challengeService';
import { i18n } from '@/i18n';
import type { Database } from '@/lib/supabase/database.types';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/features/challenges/services/challengeService', () => ({
  loadChallengeInvitations: jest.fn(),
  respondToChallengeInvitation: jest.fn(),
}));

const mockedLoadChallengeInvitations = loadChallengeInvitations as jest.MockedFunction<typeof loadChallengeInvitations>;
const mockedRespondToChallengeInvitation = respondToChallengeInvitation as jest.MockedFunction<typeof respondToChallengeInvitation>;
const client = {} as SupabaseClient<Database>;

describe('ChallengeInvitationsScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mockedLoadChallengeInvitations.mockReset();
    mockedRespondToChallengeInvitation.mockReset();
  });

  it('accepts an invitation and refreshes the list', async () => {
    mockedLoadChallengeInvitations
      .mockResolvedValueOnce([{ creator_name: 'Friend A', ends_on: '2026-07-20', id: 'challenge-1', schedule_weekdays: [1], starts_on: '2026-07-14', title: 'Morning walk' }])
      .mockResolvedValueOnce([]);
    mockedRespondToChallengeInvitation.mockResolvedValue({} as Awaited<ReturnType<typeof respondToChallengeInvitation>>);
    const screen = await render(
      <ThemeProvider preference="light">
        <ChallengeInvitationsScreen client={client} onBack={jest.fn()} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Morning walk')).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => {
      expect(mockedRespondToChallengeInvitation).toHaveBeenCalledWith(client, 'challenge-1', 'accepted');
      expect(screen.getByText('You don’t have any challenge invitations right now.')).toBeTruthy();
    });
  });
});
