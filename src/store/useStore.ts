import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  elapsedSeconds,
  isTaperPlan,
  makeId,
  moneySaved,
  puffsAvoided,
  taperFlipMoment,
  unitsAvoided,
} from '../lib/calc';
import type {
  CravingEvent,
  CravingOutcome,
  CravingPlan,
  JournalEntry,
  MissionRecord,
  NotificationPrefs,
  Plan,
  PuffEvent,
  SavingsGoal,
} from '../types';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  dangerWindow: true,
  missionReminder: true,
  missionReminderHour: 9,
  missionReminderMinute: 0,
  savingsSweep: true,
};

/** Extra detail a craving log can carry (v1.3: trigger tag, wave ratings). */
export interface CravingLogExtras {
  trigger?: string;
  intensityBefore?: number;
  intensityAfter?: number;
}

interface ExhaleState {
  /** Set true once AsyncStorage rehydration finishes; gates the router. */
  hasHydrated: boolean;
  plan: Plan | null;
  cravings: CravingEvent[];
  journal: JournalEntry[];
  /** Longest single streak ever held, in seconds. Survives quit-date resets. */
  bestStreakSeconds: number;
  relapseCount: number;
  notificationsEnabled: boolean;

  // Lifetime totals banked from finished attempts. Product rule: a slip
  // restarts the current streak, but these numbers NEVER go down or reset
  // (only a full "reset all data" in Settings clears them, by request).
  lifetimeMoneyBanked: number;
  lifetimePuffsBanked: number;
  lifetimeUnitsBanked: number;
  lifetimeFreeSecondsBanked: number;

  /** Puffs logged while cutting down in taper mode. */
  taperPuffs: PuffEvent[];
  /** The thing the user is saving their kept money toward, if set. */
  savingsGoal: SavingsGoal | null;

  /** If-then craving plans built in onboarding / Settings / rescue. */
  cravingPlans: CravingPlan[];
  /** Daily mission outcomes, keyed by local date in each record. */
  missionLog: MissionRecord[];
  /** Name of the user's chosen support person for SOS text-a-human. */
  supportName: string | null;
  /** Engagement-notification sub-toggles (master switch stays above). */
  notificationPrefs: NotificationPrefs;
  /**
   * Times the lapse-rescue flow was completed. A slip that ends in a
   * rescue is a comeback, and comebacks are counted with pride.
   */
  rescueCount: number;

  /** Milestone ids that have already had their celebration sheet. */
  celebratedMilestones: string[];
  /**
   * True once the first celebration check has run for the current data,
   * so a backlog of long-past milestones is seeded quietly instead of
   * firing a chain of sheets on first open.
   */
  celebrationSeeded: boolean;

  setHasHydrated: (v: boolean) => void;
  setPlan: (plan: Plan) => void;
  /** Replaces the plan's habit numbers (Settings edit form). */
  updatePlan: (patch: Partial<Plan>) => void;
  logCraving: (
    outcome: CravingOutcome,
    durationSec: number,
    extras?: CravingLogExtras,
  ) => CravingEvent;
  addJournalEntry: (text: string, kind?: JournalEntry['kind']) => void;
  /**
   * Moves the quit date to now, banking the finished streak's totals.
   * With `rescue: true` it also counts a comeback (lapse-rescue flow).
   */
  resetQuitDate: (opts?: { rescue?: boolean }) => void;
  addCravingPlan: (trigger: string, action: string) => void;
  removeCravingPlan: (id: string) => void;
  setMissionStatus: (
    date: string,
    missionId: string,
    status: MissionRecord['status'],
  ) => void;
  setSupportName: (name: string | null) => void;
  setNotificationPrefs: (patch: Partial<NotificationPrefs>) => void;
  /** Logs one puff against today's taper budget. */
  logPuff: () => void;
  setSavingsGoal: (goal: SavingsGoal | null) => void;
  /**
   * If a taper's flip moment has arrived (quit day reached, or the budget
   * compounded to zero), convert the plan into a full quit from that
   * moment. Safe to call on every app open; a no-op otherwise.
   */
  advanceTaperIfReady: () => void;
  setNotificationsEnabled: (v: boolean) => void;
  /** Records that a milestone's celebration has been handled. */
  markMilestoneCelebrated: (id: string) => void;
  /** Bulk-seeds celebrated ids (first-run backlog) and sets the seeded flag. */
  seedCelebrations: (ids: string[]) => void;
  resetAll: () => void;
}

export const useStore = create<ExhaleState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      plan: null,
      cravings: [],
      journal: [],
      bestStreakSeconds: 0,
      relapseCount: 0,
      notificationsEnabled: false,
      lifetimeMoneyBanked: 0,
      lifetimePuffsBanked: 0,
      lifetimeUnitsBanked: 0,
      lifetimeFreeSecondsBanked: 0,
      taperPuffs: [],
      savingsGoal: null,
      cravingPlans: [],
      missionLog: [],
      supportName: null,
      notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
      rescueCount: 0,
      celebratedMilestones: [],
      celebrationSeeded: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      setPlan: (plan) => set({ plan }),

      updatePlan: (patch) =>
        set((s) => (s.plan ? { plan: { ...s.plan, ...patch } } : s)),

      logCraving: (outcome, durationSec, extras) => {
        const event: CravingEvent = {
          id: makeId(),
          timestamp: new Date().toISOString(),
          outcome,
          durationSec,
          trigger: extras?.trigger,
          intensityBefore: extras?.intensityBefore,
          intensityAfter: extras?.intensityAfter,
        };
        const baseText =
          outcome === 'resisted'
            ? 'Rode out a craving and stayed quit.'
            : 'Slipped during a craving. Logged honestly, moving on.';
        const waveText =
          extras?.intensityBefore !== undefined &&
          extras?.intensityAfter !== undefined
            ? ` Urge surfed from ${extras.intensityBefore}/10 down to ${extras.intensityAfter}/10.`
            : '';
        const triggerText = extras?.trigger
          ? ` Trigger: ${extras.trigger}.`
          : '';
        const entry: JournalEntry = {
          id: makeId(),
          timestamp: event.timestamp,
          kind: outcome === 'resisted' ? 'resisted' : 'slip',
          text: baseText + waveText + triggerText,
        };
        set((s) => ({
          cravings: [event, ...s.cravings],
          journal: [entry, ...s.journal],
        }));
        return event;
      },

      addJournalEntry: (text, kind = 'note') => {
        const entry: JournalEntry = {
          id: makeId(),
          timestamp: new Date().toISOString(),
          text,
          kind,
        };
        set((s) => ({ journal: [entry, ...s.journal] }));
      },

      resetQuitDate: (opts) => {
        const s = get();
        const { plan } = s;
        if (!plan) return;
        const rescue = opts?.rescue === true;
        const now = new Date();
        const finishedStreak = elapsedSeconds(plan, now);
        const entry: JournalEntry = {
          id: makeId(),
          timestamp: now.toISOString(),
          kind: 'reset',
          text: rescue
            ? 'Slipped, ran the rescue, and started again. A comeback, logged with pride.'
            : 'Restarted the clock. A slip is data, not a verdict.',
        };
        set({
          plan: { ...plan, quitDate: now.toISOString() },
          bestStreakSeconds: Math.max(s.bestStreakSeconds, finishedStreak),
          relapseCount: s.relapseCount + 1,
          rescueCount: rescue ? s.rescueCount + 1 : s.rescueCount,
          // Bank the finished attempt's totals so lifetime progress is
          // preserved permanently, even though the streak restarts.
          lifetimeMoneyBanked: s.lifetimeMoneyBanked + moneySaved(plan, now),
          lifetimePuffsBanked: s.lifetimePuffsBanked + puffsAvoided(plan, now),
          lifetimeUnitsBanked: s.lifetimeUnitsBanked + unitsAvoided(plan, now),
          lifetimeFreeSecondsBanked:
            s.lifetimeFreeSecondsBanked + finishedStreak,
          journal: [entry, ...s.journal],
        });
      },

      logPuff: () => {
        const event: PuffEvent = {
          id: makeId(),
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ taperPuffs: [event, ...s.taperPuffs] }));
      },

      setSavingsGoal: (goal) => set({ savingsGoal: goal }),

      advanceTaperIfReady: () => {
        const { plan } = get();
        if (!plan || !isTaperPlan(plan) || plan.taperCompleted) return;
        const flip = taperFlipMoment(plan);
        if (!flip || new Date() < flip) return;
        const entry: JournalEntry = {
          id: makeId(),
          timestamp: new Date().toISOString(),
          kind: 'reset',
          text: 'Cut-down complete. The full quit starts now.',
        };
        set((s) => ({
          plan: { ...plan, quitDate: flip.toISOString(), taperCompleted: true },
          journal: [entry, ...s.journal],
        }));
      },

      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),

      addCravingPlan: (trigger, action) => {
        const t = trigger.trim();
        const a = action.trim();
        if (!t || !a) return;
        set((s) => ({
          cravingPlans: [
            ...s.cravingPlans,
            { id: makeId(), trigger: t, action: a },
          ],
        }));
      },

      removeCravingPlan: (id) =>
        set((s) => ({
          cravingPlans: s.cravingPlans.filter((p) => p.id !== id),
        })),

      setMissionStatus: (date, missionId, status) =>
        set((s) => ({
          missionLog: [
            ...s.missionLog.filter((m) => m.date !== date),
            { date, missionId, status },
          ],
        })),

      setSupportName: (name) =>
        set({ supportName: name && name.trim() ? name.trim() : null }),

      setNotificationPrefs: (patch) =>
        set((s) => ({
          notificationPrefs: { ...s.notificationPrefs, ...patch },
        })),

      markMilestoneCelebrated: (id) =>
        set((s) =>
          s.celebratedMilestones.includes(id)
            ? s
            : { celebratedMilestones: [...s.celebratedMilestones, id] },
        ),

      seedCelebrations: (ids) =>
        set((s) => ({
          celebratedMilestones: Array.from(
            new Set([...s.celebratedMilestones, ...ids]),
          ),
          celebrationSeeded: true,
        })),

      resetAll: () =>
        set({
          plan: null,
          cravings: [],
          journal: [],
          bestStreakSeconds: 0,
          relapseCount: 0,
          notificationsEnabled: false,
          lifetimeMoneyBanked: 0,
          lifetimePuffsBanked: 0,
          lifetimeUnitsBanked: 0,
          lifetimeFreeSecondsBanked: 0,
          taperPuffs: [],
          savingsGoal: null,
          cravingPlans: [],
          missionLog: [],
          supportName: null,
          notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
          rescueCount: 0,
          celebratedMilestones: [],
          celebrationSeeded: false,
        }),
    }),
    {
      name: 'exhale-state-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        plan: s.plan,
        cravings: s.cravings,
        journal: s.journal,
        bestStreakSeconds: s.bestStreakSeconds,
        relapseCount: s.relapseCount,
        notificationsEnabled: s.notificationsEnabled,
        lifetimeMoneyBanked: s.lifetimeMoneyBanked,
        lifetimePuffsBanked: s.lifetimePuffsBanked,
        lifetimeUnitsBanked: s.lifetimeUnitsBanked,
        lifetimeFreeSecondsBanked: s.lifetimeFreeSecondsBanked,
        taperPuffs: s.taperPuffs,
        savingsGoal: s.savingsGoal,
        cravingPlans: s.cravingPlans,
        missionLog: s.missionLog,
        supportName: s.supportName,
        notificationPrefs: s.notificationPrefs,
        rescueCount: s.rescueCount,
        celebratedMilestones: s.celebratedMilestones,
        celebrationSeeded: s.celebrationSeeded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
