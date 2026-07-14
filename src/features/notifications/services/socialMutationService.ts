import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';

type SocialMutationRequest =
  | { action: 'create_friend_request'; recipientId: string }
  | {
      action: 'create_one_to_one_challenge';
      endsOn: string;
      friendId: string;
      scheduleWeekdays: number[];
      startsOn: string;
      title: string;
    };

export class SocialMutationError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'SocialMutationError';
  }
}

export async function invokeSocialMutation<Result>(
  client: SupabaseClient<Database>,
  request: SocialMutationRequest,
): Promise<Result> {
  const { data, error } = await client.functions.invoke('social-mutations', {
    body: request,
  });

  if (error || !isRecord(data)) {
    throw new SocialMutationError('SOCIAL_MUTATION_FAILED');
  }

  if (typeof data.errorCode === 'string') {
    throw new SocialMutationError(data.errorCode);
  }

  if (!('data' in data)) {
    throw new SocialMutationError('SOCIAL_MUTATION_FAILED');
  }

  return data.data as Result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
