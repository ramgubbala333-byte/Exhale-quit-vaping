import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { elapsedSeconds, makeId } from '../lib/calc';
import type { CravingEvent, CravingOutcome, JournalEntry, Plan } from '../types';

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

  setHasHydrated: (v: boolean) => void;
  setPlan: (plan: Plan) => void;
  /** Replaces the plan's habit numbers (Settings edit form). */
  updatePlan: (patch: Partial<Plan>) => void;
  logCraving: (outcome: CravingOutcome, durationSec: number) => CravingEvent;
  addJournalEntry: (text: string, kind?: JournalEntry['kind']) => void;
  /** Moves the quit date to now and banks the finished streak. */
  resetQuitDate: () => void;
  setNotificationsEnabled: (v: boolean) => void;
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
        const { plan } = get();
        if (!plan) return;
        const finishedStreak = elapsedSeconds(plan);
        const entry: JournalEntry = {
          id: makeId(),
          timestamp: new Date().toISOString(),
          kind: 'reset',
          text: 'Restarted the clock. A slip is data, not a verdict.',
        };
        set((s) => ({
          plan: { ...plan, quitDate: new Date().toISOString() },
          bestStreakSeconds: Math.max(s.bestStreakSeconds, finishedStreak),
          relapseCount: s.relapseCount + 1,
          journal: [entry, ...s.journal],
        }));
      },

      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),

      resetAll: () =>
        set({
          plan: null,
          cravings: [],
          journal: [],
          bestStreakSeconds: 0,
          relapseCount: 0,
          notificationsEnabled: false,
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
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
