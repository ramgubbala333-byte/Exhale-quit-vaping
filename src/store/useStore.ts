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
  JournalEntry,
  Plan,
  PuffEvent,
  SavingsGoal,
} from '../types';

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
  logCraving: (outcome: CravingOutcome, durationSec: number) => CravingEvent;
  addJournalEntry: (text: string, kind?: JournalEntry['kind']) => void;
  /** Moves the quit date to now, banking the finished streak's totals. */
  resetQuitDate: () => void;
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
      celebratedMilestones: [],
      celebrationSeeded: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      setPlan: (plan) => set({ plan }),

      updatePlan: (patch) =>
        set((s) => (s.plan ? { plan: { ...s.plan, ...patch } } : s)),

      logCraving: (outcome, durationSec) => {
        const event: CravingEvent = {
          id: makeId(),
          timestamp: new Date().toISOString(),
          outcome,
          durationSec,
        };
        const entry: JournalEntry = {
          id: makeId(),
          timestamp: event.timestamp,
          kind: outcome === 'resisted' ? 'resisted' : 'slip',
          text:
            outcome === 'resisted'
              ? 'Rode out a craving with the breathing exercise.'
              : 'Slipped during a craving. Logged honestly, moving on.',
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

      resetQuitDate: () => {
        const s = get();
        const { plan } = s;
        if (!plan) return;
        const now = new Date();
        const finishedStreak = elapsedSeconds(plan, now);
        const entry: JournalEntry = {
          id: makeId(),
          timestamp: now.toISOString(),
          kind: 'reset',
          text: 'Restarted the clock. A slip is data, not a verdict.',
        };
        set({
          plan: { ...plan, quitDate: now.toISOString() },
          bestStreakSeconds: Math.max(s.bestStreakSeconds, finishedStreak),
          relapseCount: s.relapseCount + 1,
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
        celebratedMilestones: s.celebratedMilestones,
        celebrationSeeded: s.celebrationSeeded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
