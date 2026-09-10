import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Local dose reminders.
 *
 * Local notifications are the backbone of PetMed reminders: they fire on the
 * device even without internet, in airplane mode or with the app closed.
 * Push notifications sent by the server are only a complement.
 *
 * iOS allows a limited number of pending scheduled notifications per app
 * (~64), so we only schedule the next MAX_SCHEDULED upcoming occurrences and
 * re-sync whenever the app shows fresh dose data.
 */

const ANDROID_CHANNEL_ID = "dose-reminders";
const MAX_SCHEDULED = 60;
const IDENTIFIER_PREFIX = "petmed-dose-";

let handlerConfigured = false;

function isSupported() {
  return Platform.OS !== "web";
}

function configureHandler() {
  if (handlerConfigured || !isSupported()) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Requests permission (Android 13+ runtime permission, iOS authorization) and
 * creates the Android channel. Returns whether scheduling is allowed.
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!isSupported()) return false;
  configureHandler();
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: "Lembretes de dose",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    console.warn("[Notifications] Permission request failed:", error);
    return false;
  }
}

export type TreatmentReminder = {
  treatmentId: number;
  petName: string;
  name: string;
  dose: string;
  unit: string;
  times: string[];
  /** YYYY-MM-DD */
  startDate: string;
  durationDays: number;
};

function nextOccurrences(times: string[], startDate: string, durationDays: number, limit: number): Date[] {
  const occurrences: Date[] = [];
  const [year, month, day] = startDate.split("-").map(Number);
  for (let offset = 0; offset < durationDays && occurrences.length < limit; offset++) {
    for (const time of [...times].sort()) {
      const [hour, minute] = time.split(":").map(Number);
      // Local wall-clock time: matches what the user typed in the form.
      const scheduled = new Date(year, month - 1, day + offset, hour, minute);
      if (scheduled.getTime() > Date.now()) occurrences.push(scheduled);
      if (occurrences.length >= limit) break;
    }
  }
  return occurrences;
}

/**
 * Schedules local alarms for the upcoming doses of a treatment. Best effort:
 * resolves to false instead of throwing when permission is denied.
 */
export async function scheduleTreatmentNotifications(reminder: TreatmentReminder): Promise<boolean> {
  if (!isSupported()) return false;
  const allowed = await ensureNotificationPermissions();
  if (!allowed) return false;
  try {
    await cancelTreatmentNotifications(reminder.treatmentId);
    const occurrences = nextOccurrences(reminder.times, reminder.startDate, reminder.durationDays, MAX_SCHEDULED);
    await Promise.all(
      occurrences.map((date, index) =>
        Notifications.scheduleNotificationAsync({
          identifier: `${IDENTIFIER_PREFIX}${reminder.treatmentId}-${index}`,
          content: {
            title: `Hora do remédio de ${reminder.petName}`,
            body: `${reminder.name} · ${reminder.dose} ${reminder.unit}`,
            sound: true,
            ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
            data: { treatmentId: reminder.treatmentId },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
        }),
      ),
    );
    return true;
  } catch (error) {
    console.warn("[Notifications] Failed to schedule dose reminders:", error);
    return false;
  }
}

/** Cancels every pending reminder that belongs to a treatment. */
export async function cancelTreatmentNotifications(treatmentId: number): Promise<void> {
  if (!isSupported()) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const prefix = `${IDENTIFIER_PREFIX}${treatmentId}-`;
    await Promise.all(
      scheduled
        .filter((notification) => notification.identifier.startsWith(prefix))
        .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)),
    );
  } catch (error) {
    console.warn("[Notifications] Failed to cancel dose reminders:", error);
  }
}

/**
 * Re-sync entry point called when fresh dose data is shown: guarantees the
 * permission/channel setup ran at least once on app usage.
 */
export async function resyncDoseReminders(): Promise<void> {
  if (!isSupported()) return;
  await ensureNotificationPermissions();
}
