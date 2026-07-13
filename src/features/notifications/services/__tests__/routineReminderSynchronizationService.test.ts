import type { SupabaseClient } from '@supabase/supabase-js';

import { synchronizeRoutineReminder } from '@/features/notifications/services/routineReminderService';
import { synchronizeActiveRoutineReminders } from '@/features/notifications/services/routineReminderSynchronizationService';
import type { Database } from '@/lib/supabase/database.types';

jest.mock('@/features/notifications/services/routineReminderService', () => ({
  synchronizeRoutineReminder: jest.fn(() => Promise.resolve()),
}));

const mockedSynchronizeRoutineReminder = synchronizeRoutineReminder as jest.MockedFunction<
  typeof synchronizeRoutineReminder
>;

function createClient(data: unknown, error: unknown = null): SupabaseClient<Database> {
  const not = jest.fn(() => Promise.resolve({ data, error }));
  const eq = jest.fn(() => ({ not }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));

  return { from } as unknown as SupabaseClient<Database>;
}

describe('routine reminder synchronization service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces every active routine reminder after a configuration change', async () => {
    await synchronizeActiveRoutineReminders(createClient([
      { id: 'routine-1', reminder_minute: 540, schedule_weekdays: [1, 3] },
      { id: 'routine-2', reminder_minute: 1020, schedule_weekdays: [0, 6] },
    ]));

    expect(mockedSynchronizeRoutineReminder).toHaveBeenCalledTimes(2);
    expect(mockedSynchronizeRoutineReminder).toHaveBeenCalledWith({
      reminderMinute: 540,
      routineId: 'routine-1',
      scheduleWeekdays: [1, 3],
    });
    expect(mockedSynchronizeRoutineReminder).toHaveBeenCalledWith({
      reminderMinute: 1020,
      routineId: 'routine-2',
      scheduleWeekdays: [0, 6],
    });
  });

  it('does not alter scheduled reminders when routine loading fails', async () => {
    await synchronizeActiveRoutineReminders(createClient(null, new Error('NETWORK')));

    expect(mockedSynchronizeRoutineReminder).not.toHaveBeenCalled();
  });
});
