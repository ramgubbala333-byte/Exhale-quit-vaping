import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { dailyCost, elapsedDays, formatMoneyExact } from './calc';
import { cravingForecast } from './forecast';
import { MILESTONES } from './milestones';
import { missionForDate } from './missions';
import { useStore } from '../store/useStore';
import type { Plan } from '../types';

/**
 * Local notifications only: a daily check-in and one alert per upcoming
 * health milestone. Everything is wrapped defensively: notifications are
 * a nice-to-have, and the app must work identically if permission is
 * denied or the platform (e.g. web) does not support scheduling.
 */

const DAILY_ID = 'exhale-daily-checkin';
const MILESTONE_PREFIX = 'exhale-milestone-';
const DANGER_ID = 'mistless-danger-window';
const MISSION_ID = 'mistless-mission-reminder';
const SWEEP_ID = 'mistless-savings-sweep';
const ENGAGEMENT_IDS = [DANGER_ID, MISSION_ID, SWEEP_ID];

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
        body: 'Another day nicotine-free. Open Mistless to see how far you have come.',
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
            n.identifier.startsWith(MILESTONE_PREFIX) ||
            ENGAGEMENT_IDS.includes(n.identifier),
        )
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Nothing to cancel or platform unsupported.
  }
}

/**
 * Full reschedule from current store state: the classic reminders
 * (daily check-in + milestone alerts) plus the v1.3 engagement set,
 * each gated by its own Settings toggle:
 *
 * - Danger-window heads-up, 30 minutes before the user's known peak
 *   craving hour (only once the forecast has enough logged cravings).
 * - Morning mission reminder at the user's chosen time.
 * - Friday savings sweep with the amount kept in the last seven days.
 *
 * Copy stays honest and pressure-free: no guilt, no streak threats.
 * Safe to call on app open and after any settings change; everything
 * is best-effort and silent on failure.
 */
export async function refreshAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const s = useStore.getState();
    if (!s.notificationsEnabled || !s.plan) {
      await cancelReminders();
      return;
    }
    await scheduleReminders(s.plan);

    // Clear the engagement set before rescheduling per current prefs.
    for (const id of ENGAGEMENT_IDS) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // Not scheduled; nothing to clear.
      }
    }

    const prefs = s.notificationPrefs;

    if (prefs.dangerWindow) {
      const forecast = cravingForecast(s.cravings);
      if (forecast) {
        let mins = forecast.peakHour * 60 - 30;
        if (mins < 0) mins += 24 * 60;
        const hourLabel = new Date();
        hourLabel.setHours(forecast.peakHour, 0, 0, 0);
        await Notifications.scheduleNotificationAsync({
          identifier: DANGER_ID,
          content: {
            title: 'Your danger window is near',
            body: `Most of your cravings land around ${hourLabel.toLocaleTimeString('en-US', { hour: 'numeric' })}. Your plans and the wave are ready in SOS if one shows up.`,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: Math.floor(mins / 60),
            minute: mins % 60,
          },
        });
      }
    }

    if (prefs.missionReminder) {
      const mission = missionForDate();
      await Notifications.scheduleNotificationAsync({
        identifier: MISSION_ID,
        content: {
          title: "Today's mission",
          body: `${mission.title}. ${mission.detail}`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: prefs.missionReminderHour,
          minute: prefs.missionReminderMinute,
        },
      });
    }

    if (prefs.savingsSweep) {
      const days = Math.min(7, elapsedDays(s.plan));
      const kept = dailyCost(s.plan) * days;
      await Notifications.scheduleNotificationAsync({
        identifier: SWEEP_ID,
        content: {
          title: 'Friday savings sweep',
          body: `You kept ${formatMoneyExact(kept)} this week. Move it somewhere it works for you?`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 6, // Friday (1 = Sunday)
          hour: 18,
          minute: 0,
        },
      });
    }
  } catch {
    // Scheduling is best-effort; ignore failures silently.
  }
}
