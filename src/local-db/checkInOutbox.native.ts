import { randomUUID } from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

export type CheckInOutboxOperation = {
  createdAt: string;
  id: string;
  idempotencyKey: string;
  kind: 'complete' | 'undo';
  lastErrorCode: string | null;
  nextAttemptAt: string;
  occurredAt: string;
  retryCount: number;
  routineDay: string;
  routineItemId: string;
  userId: string;
};

type StoredCheckInOutboxOperation = {
  created_at: string;
  id: string;
  idempotency_key: string;
  kind: 'complete' | 'undo';
  last_error_code: string | null;
  next_attempt_at: string;
  occurred_at: string;
  retry_count: number;
  routine_day: string;
  routine_item_id: string;
  user_id: string;
};

const DATABASE_NAME = 'wecanday.db';
const INITIAL_RETRY_DELAY_MS = 15_000;
const MAX_RETRY_DELAY_MS = 15 * 60_000;
let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export function createCheckInOutboxOperation(input: {
  kind: CheckInOutboxOperation['kind'];
  occurredAt: string;
  routineDay: string;
  routineItemId: string;
  userId: string;
}): CheckInOutboxOperation {
  const id = randomUUID();

  return {
    createdAt: input.occurredAt,
    id,
    idempotencyKey: id,
    kind: input.kind,
    lastErrorCode: null,
    nextAttemptAt: input.occurredAt,
    occurredAt: input.occurredAt,
    retryCount: 0,
    routineDay: input.routineDay,
    routineItemId: input.routineItemId,
    userId: input.userId,
  };
}

export async function enqueueCheckInOperation(
  operation: CheckInOutboxOperation,
): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `delete from sync_outbox
       where user_id = ? and routine_item_id = ? and routine_day = ?`,
      operation.userId,
      operation.routineItemId,
      operation.routineDay,
    );
    await database.runAsync(
      `insert into sync_outbox (
        id, user_id, kind, routine_item_id, routine_day, occurred_at,
        idempotency_key, created_at, retry_count, last_error_code, next_attempt_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      operation.id,
      operation.userId,
      operation.kind,
      operation.routineItemId,
      operation.routineDay,
      operation.occurredAt,
      operation.idempotencyKey,
      operation.createdAt,
      operation.retryCount,
      operation.lastErrorCode,
      operation.nextAttemptAt,
    );
  });
}

export async function loadPendingCheckInOperations(
  userId: string,
  routineDay: string,
): Promise<CheckInOutboxOperation[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<StoredCheckInOutboxOperation>(
    `select id, user_id, kind, routine_item_id, routine_day, occurred_at,
      idempotency_key, created_at, retry_count, last_error_code, next_attempt_at
     from sync_outbox
     where user_id = ? and routine_day = ?
     order by created_at asc`,
    userId,
    routineDay,
  );

  return rows.map(fromStoredOperation);
}

export async function loadDueCheckInOperations(
  userId: string,
  now: string,
): Promise<CheckInOutboxOperation[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<StoredCheckInOutboxOperation>(
    `select id, user_id, kind, routine_item_id, routine_day, occurred_at,
      idempotency_key, created_at, retry_count, last_error_code, next_attempt_at
     from sync_outbox
     where user_id = ? and next_attempt_at <= ?
     order by created_at asc`,
    userId,
    now,
  );

  return rows.map(fromStoredOperation);
}

export async function removeCheckInOperation(
  operation: Pick<CheckInOutboxOperation, 'id'>,
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('delete from sync_outbox where id = ?', operation.id);
}

export async function removeCheckInOperationsForRoutine(
  userId: string,
  routineItemId: string,
  routineDay: string,
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `delete from sync_outbox
     where user_id = ? and routine_item_id = ? and routine_day = ?`,
    userId,
    routineItemId,
    routineDay,
  );
}

export async function markCheckInOperationFailed(
  operation: CheckInOutboxOperation,
  errorCode: string,
  now: Date,
): Promise<void> {
  const retryCount = operation.retryCount + 1;
  const nextAttemptAt = new Date(
    now.getTime() + getRetryDelayMs(retryCount),
  ).toISOString();
  const database = await getDatabase();

  await database.runAsync(
    `update sync_outbox
     set retry_count = ?, last_error_code = ?, next_attempt_at = ?
     where id = ?`,
    retryCount,
    errorCode,
    nextAttemptAt,
    operation.id,
  );
}

function getRetryDelayMs(retryCount: number): number {
  return Math.min(
    INITIAL_RETRY_DELAY_MS * 2 ** Math.max(0, retryCount - 1),
    MAX_RETRY_DELAY_MS,
  );
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync(`
        pragma journal_mode = wal;
        create table if not exists sync_outbox (
          id text primary key not null,
          user_id text not null,
          kind text not null check (kind in ('complete', 'undo')),
          routine_item_id text not null,
          routine_day text not null,
          occurred_at text not null,
          idempotency_key text not null unique,
          created_at text not null,
          retry_count integer not null default 0,
          last_error_code text,
          next_attempt_at text not null
        );
        create index if not exists sync_outbox_pending_lookup_idx
          on sync_outbox(user_id, routine_day, next_attempt_at);
      `);
      return database;
    });
  }

  return databasePromise;
}

function fromStoredOperation(
  operation: StoredCheckInOutboxOperation,
): CheckInOutboxOperation {
  return {
    createdAt: operation.created_at,
    id: operation.id,
    idempotencyKey: operation.idempotency_key,
    kind: operation.kind,
    lastErrorCode: operation.last_error_code,
    nextAttemptAt: operation.next_attempt_at,
    occurredAt: operation.occurred_at,
    retryCount: operation.retry_count,
    routineDay: operation.routine_day,
    routineItemId: operation.routine_item_id,
    userId: operation.user_id,
  };
}
