import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { MILESTONES } from './milestones';
import type { Plan } from '../types';

/**
 * Local notifications only: a daily check-in and one alert per upcoming
 * health milestone. Everything is wrapped defensively: notifications are
 * a nice-to-have, and the app must work identically if permission is
 * denied or the platform (e.g. web) does not support scheduling.
 */

const DAILY_ID = 'exhale-daily-checkin';
const MILESTONE_PREFIX = 'exhale-milestone-';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission when not yet decided. Returns true when granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function scheduleReminders(plan: Plan): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelReminders();

    // Daily check-in at 9:00 local time.
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: {
        title: 'Morning check-in',
        body: 'Another day nicotine-free. Open Exhale to see how far you have come.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });

    // The next few milestones that are still in the future.
    const quitMs = new Date(plan.quitDate).getTime();
    const upcoming = MILESTONES.map((m) => ({
      milestone: m,
      at: new Date(quitMs + m.offsetSeconds * 1000),
    }))
      .filter((x) => x.at.getTime() > Date.now())
      .slice(0, 5);

    for (const { milestone, at } of upcoming) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${MILESTONE_PREFIX}${milestone.id}`,
        content: {
          title: `Milestone reached: ${milestone.label}`,
          body: milestone.title,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: at,
        },
      });
    }
  } catch {
    // Scheduling is best-effort; ignore failures silently.
  }
}

export async function cancelReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(
          (n) =>
            n.identifier === DAILY_ID ||
            n.identifier.startsWith(MILESTONE_PREFIX),
        )
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Nothing to cancel or platform unsupported.
  }
}
