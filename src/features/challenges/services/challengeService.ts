import type { SupabaseClient } from '@supabase/supabase-js';

import {
  ChallengeDomainError,
} from '@/features/challenges/domain/challengeErrors';
import {
  validateChallengeInput,
  type ChallengeInput,
} from '@/features/challenges/domain/challengeInput';
import {
  SocialMutationError,
  invokeSocialMutation,
} from '@/features/notifications/services/socialMutationService';
import type {
  ChallengeInvitationRow,
  ChallengeRow,
  Database,
} from '@/lib/supabase/database.types';

export async function createOneToOneChallenge(
  client: SupabaseClient<Database>,
  input: ChallengeInput,
): Promise<ChallengeRow> {
  const validatedInput = validateChallengeInput(input);
  try {
    return await invokeSocialMutation<ChallengeRow>(client, {
      action: 'create_one_to_one_challenge',
      endsOn: validatedInput.endsOn,
      friendId: validatedInput.friendId,
      scheduleWeekdays: validatedInput.scheduleWeekdays,
      startsOn: validatedInput.startsOn,
      title: validatedInput.title,
    });
  } catch (error) {
    throw mapChallengeError(
      error instanceof SocialMutationError ? error.code : undefined,
      'CHALLENGE_CREATE_FAILED',
    );
  }
}

export async function loadChallengeInvitations(
  client: SupabaseClient<Database>,
): Promise<ChallengeInvitationRow[]> {
  const { data, error } = await client.rpc('list_challenge_invitations');

  if (error || !data) {
    throw mapChallengeError(error?.message, 'CHALLENGE_LOAD_FAILED');
  }

  return data;
}

export async function respondToChallengeInvitation(
  client: SupabaseClient<Database>,
  challengeId: string,
  response: 'accepted' | 'declined',
): Promise<ChallengeRow> {
  const { data, error } = await client.rpc('respond_to_one_to_one_challenge', {
    p_challenge_id: challengeId,
    p_response: response,
  });

  if (error || !data) {
    throw mapChallengeError(error?.message, 'CHALLENGE_CREATE_FAILED');
  }

  return data;
}

function mapChallengeError(
  message: string | undefined,
  fallback: 'CHALLENGE_CREATE_FAILED' | 'CHALLENGE_LOAD_FAILED',
): ChallengeDomainError {
  if (message?.includes('CHALLENGE_INVITATION_NOT_FOUND')) {
    return new ChallengeDomainError('CHALLENGE_INVITATION_NOT_FOUND');
  }

  if (message?.includes('INVALID_CHALLENGE_RESPONSE')) {
    return new ChallengeDomainError('INVALID_CHALLENGE_RESPONSE');
  }

  if (message?.includes('ROUTINE_LIMIT_REACHED')) {
    return new ChallengeDomainError('ROUTINE_LIMIT_REACHED');
  }

  if (message?.includes('USER_BLOCKED')) {
    return new ChallengeDomainError('USER_BLOCKED');
  }

  return new ChallengeDomainError(fallback);
}
