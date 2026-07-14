import type { SupabaseClient } from '@supabase/supabase-js';

import {
  SocialMutationError,
  invokeSocialMutation,
} from '@/features/notifications/services/socialMutationService';
import type { Database } from '@/lib/supabase/database.types';

const invoke = jest.fn();
const client = {
  functions: { invoke },
} as unknown as SupabaseClient<Database>;

describe('social mutation service', () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it('returns a validated server mutation result', async () => {
    invoke.mockResolvedValue({
      data: { data: { id: 'friendship-1' } },
      error: null,
    });

    await expect(invokeSocialMutation<{ id: string }>(client, {
      action: 'create_friend_request',
      recipientId: 'friend-1',
    })).resolves.toEqual({ id: 'friendship-1' });
  });

  it('keeps server domain error codes without exposing a server message', async () => {
    invoke.mockResolvedValue({
      data: { errorCode: 'USER_BLOCKED' },
      error: null,
    });

    await expect(invokeSocialMutation(client, {
      action: 'create_friend_request',
      recipientId: 'friend-1',
    })).rejects.toEqual(new SocialMutationError('USER_BLOCKED'));
  });
});
