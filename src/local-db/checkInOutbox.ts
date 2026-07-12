import AsyncStorage from '@react-native-async-storage/async-storage';

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

const WEB_STORAGE_KEY = 'wecanday:check-in-outbox:v1';
const INITIAL_RETRY_DELAY_MS = 15_000;
const MAX_RETRY_DELAY_MS = 15 * 60_000;

export function createCheckInOutboxOperation(input: {
  kind: CheckInOutboxOperation['kind'];
  occurredAt: string;
  routineDay: string;
  routineItemId: string;
  userId: string;
}): CheckInOutboxOperation {
  const id = createWebUuid();

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
  const operations = await loadWebOperations();
  const nextOperations = operations.filter(
    (candidate) =>
      candidate.userId !== operation.userId ||
      candidate.routineItemId !== operation.routineItemId ||
      candidate.routineDay !== operation.routineDay,
  );

  await saveWebOperations([...nextOperations, operation]);
}

export async function loadPendingCheckInOperations(
  userId: string,
  routineDay: string,
): Promise<CheckInOutboxOperation[]> {
  return (await loadWebOperations())
    .filter(
      (operation) =>
        operation.userId === userId && operation.routineDay === routineDay,
    )
    .toSorted((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function loadDueCheckInOperations(
  userId: string,
  now: string,
): Promise<CheckInOutboxOperation[]> {
  return (await loadWebOperations())
    .filter(
      (operation) =>
        operation.userId === userId && operation.nextAttemptAt <= now,
    )
    .toSorted((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function removeCheckInOperation(
  operation: Pick<CheckInOutboxOperation, 'id'>,
): Promise<void> {
  await saveWebOperations(
    (await loadWebOperations()).filter((candidate) => candidate.id !== operation.id),
  );
}

export async function removeCheckInOperationsForRoutine(
  userId: string,
  routineItemId: string,
  routineDay: string,
): Promise<void> {
  await saveWebOperations(
    (await loadWebOperations()).filter(
      (candidate) =>
        candidate.userId !== userId ||
        candidate.routineItemId !== routineItemId ||
        candidate.routineDay !== routineDay,
    ),
  );
}

export async function markCheckInOperationFailed(
  operation: CheckInOutboxOperation,
  errorCode: string,
  now: Date,
): Promise<void> {
  const retryCount = operation.retryCount + 1;
  const updatedOperation = {
    ...operation,
    lastErrorCode: errorCode,
    nextAttemptAt: new Date(
      now.getTime() + getRetryDelayMs(retryCount),
    ).toISOString(),
    retryCount,
  };

  await saveWebOperations(
    (await loadWebOperations()).map((candidate) =>
      candidate.id === operation.id ? updatedOperation : candidate,
    ),
  );
}

function createWebUuid(): string {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('Secure UUID generation is unavailable in this browser.');
  }

  return globalThis.crypto.randomUUID();
}

function getRetryDelayMs(retryCount: number): number {
  return Math.min(
    INITIAL_RETRY_DELAY_MS * 2 ** Math.max(0, retryCount - 1),
    MAX_RETRY_DELAY_MS,
  );
}

async function loadWebOperations(): Promise<CheckInOutboxOperation[]> {
  const rawValue = await AsyncStorage.getItem(WEB_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter(isCheckInOutboxOperation)
      : [];
  } catch {
    return [];
  }
}

async function saveWebOperations(
  operations: CheckInOutboxOperation[],
): Promise<void> {
  await AsyncStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(operations));
}

function isCheckInOutboxOperation(
  value: unknown,
): value is CheckInOutboxOperation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const operation = value as Partial<CheckInOutboxOperation>;

  return (
    typeof operation.id === 'string' &&
    typeof operation.idempotencyKey === 'string' &&
    typeof operation.userId === 'string' &&
    typeof operation.routineItemId === 'string' &&
    typeof operation.routineDay === 'string' &&
    (operation.kind === 'complete' || operation.kind === 'undo')
  );
}
