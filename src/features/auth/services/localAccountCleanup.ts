import { clearPushInstallationId } from '@/features/notifications/services/devicePushTokenService';
import { clearNotificationPermissionPrimer } from '@/features/notifications/services/notificationPermissionService';
import { cancelManagedRoutineReminders } from '@/features/notifications/services/routineReminderService';
import { clearCheckInOperationsForUser } from '@/local-db/checkInOutbox';

export async function clearSignedOutUserData(userId: string): Promise<void> {
  await Promise.allSettled([
    cancelManagedRoutineReminders(),
    clearCheckInOperationsForUser(userId),
    clearNotificationPermissionPrimer(userId),
  ]);
}

export async function clearDeletedUserData(userId: string): Promise<void> {
  await Promise.allSettled([
    clearSignedOutUserData(userId),
    clearPushInstallationId(),
  ]);
}
