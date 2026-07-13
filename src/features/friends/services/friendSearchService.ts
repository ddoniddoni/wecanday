import type { SupabaseClient } from '@supabase/supabase-js';

import {
  FriendSearchDomainError,
  isPublicCode,
} from '@/features/friends/domain/friendSearch';
import type { Database, FriendCodeLookupRow } from '@/lib/supabase/database.types';

export async function lookupFriendByPublicCode(
  client: SupabaseClient<Database>,
  publicCode: string,
): Promise<FriendCodeLookupRow | null> {
  if (!isPublicCode(publicCode)) {
    throw new FriendSearchDomainError('INVALID_PUBLIC_CODE');
  }

  const { data, error } = await client.rpc('lookup_profile_by_public_code', {
    p_public_code: publicCode,
  });

  if (!error) {
    return data?.[0] ?? null;
  }

  if (error.message.includes('FRIEND_CODE_RATE_LIMITED')) {
    throw new FriendSearchDomainError('FRIEND_CODE_RATE_LIMITED');
  }

  throw new FriendSearchDomainError('FRIEND_SEARCH_FAILED');
}
