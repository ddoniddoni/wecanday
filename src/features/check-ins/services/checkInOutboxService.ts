import { getCheckInErrorCode } from '@/features/check-ins/domain/checkInErrors';
import {
  completeCheckIn,
  undoCheckIn,
  type CheckInMutation,
} from '@/features/check-ins/services/checkInService';
import type { Database } from '@/lib/supabase/database.types';
import {
  loadDueCheckInOperations,
  markCheckInOperationFailed,
  removeCheckInOperation,
} from '@/local-db/checkInOutbox';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function synchronizePendingCheckIns(
  client: SupabaseClient<Database>,
  userId: string,
  now: Date,
): Promise<void> {
  const operations = await loadDueCheckInOperations(userId, now.toISOString());

  for (const operation of operations) {
    const mutation: CheckInMutation = {
      idempotencyKey: operation.idempotencyKey,
      occurredAt: operation.occurredAt,
      routineDay: operation.routineDay,
      routineItemId: operation.routineItemId,
      source: 'offline_sync',
    };

    try {
      if (operation.kind === 'complete') {
        await completeCheckIn(client, mutation);
      } else {
        await undoCheckIn(client, mutation);
      }

      await removeCheckInOperation(operation);
    } catch (error) {
      await markCheckInOperationFailed(operation, getCheckInErrorCode(error), now);
    }
  }
}
