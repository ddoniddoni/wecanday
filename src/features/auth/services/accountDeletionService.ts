import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';

const ACCOUNT_DELETION_CONFIRMATION = 'DELETE_ACCOUNT';

export class AccountDeletionError extends Error {
  constructor(public readonly code: 'ACCOUNT_DELETION_FAILED') {
    super(code);
    this.name = 'AccountDeletionError';
  }
}

export async function deleteCurrentAccount(
  client: SupabaseClient<Database>,
): Promise<void> {
  const { data, error } = await client.functions.invoke('delete-account', {
    body: { confirmation: ACCOUNT_DELETION_CONFIRMATION },
  });

  if (error || !isDeletionResponse(data)) {
    throw new AccountDeletionError('ACCOUNT_DELETION_FAILED');
  }
}

function isDeletionResponse(value: unknown): value is { data: { deleted: true } } {
  return isRecord(value) &&
    isRecord(value.data) &&
    value.data.deleted === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
