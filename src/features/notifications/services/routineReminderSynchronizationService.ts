import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';
import { synchronizeRoutineReminder } from '@/features/notifications/services/routineReminderService';

export async function synchronizeActiveRoutineReminders(
  client: SupabaseClient<Database>,
): Promise<void> {
  const { data: routines, error } = await client
    .from('routine_items')
    .select('id, reminder_minute, schedule_weekdays')
    .eq('status', 'active')
    .not('reminder_minute', 'is', null);

  if (error || !routines) {
    return;
  }

  await Promise.all(
    routines.map((routine) =>
      synchronizeRoutineReminder({
        reminderMinute: routine.reminder_minute,
        routineId: routine.id,
        scheduleWeekdays: routine.schedule_weekdays,
      }),
    ),
  );
}
