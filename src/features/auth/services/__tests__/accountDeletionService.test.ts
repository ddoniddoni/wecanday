import type { SupabaseClient } from '@supabase/supabase-js';

import {
  AccountDeletionError,
  deleteCurrentAccount,
} from '@/features/auth/services/accountDeletionService';
import type { Database } from '@/lib/supabase/database.types';

const invoke = jest.fn();
const client = {
  functions: { invoke },
} as unknown as SupabaseClient<Database>;

describe('account deletion service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests authenticated server-side deletion with an explicit confirmation', async () => {
    invoke.mockResolvedValue({ data: { data: { deleted: true } }, error: null });

    await deleteCurrentAccount(client);

    expect(invoke).toHaveBeenCalledWith('delete-account', {
      body: { confirmation: 'DELETE_ACCOUNT' },
    });
  });

  it('does not expose server deletion errors to the UI layer', async () => {
    invoke.mockResolvedValue({ data: { errorCode: 'ACCOUNT_DELETION_UNAUTHORIZED' }, error: null });

    await expect(deleteCurrentAccount(client)).rejects.toEqual(
      new AccountDeletionError('ACCOUNT_DELETION_FAILED'),
    );
  });
});
