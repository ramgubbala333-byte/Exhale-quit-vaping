/** Shared data model for Exhale. Everything is stored on-device only. */

export type DeviceType = 'disposable' | 'pod' | 'refillable';

/** How the user chose to quit: all at once, or by cutting down first. */
export type QuitApproach = 'now' | 'taper';

export interface TaperConfig {
  /** Percent the daily puff budget drops each week, e.g. 25. */
  weeklyCutPercent: number;
  /** ISO date (local start of day) the taper began. */
  startDate: string;
  /** ISO timestamp of the chosen quit day. */
  targetQuitDate: string;
}

export interface Plan {
  deviceType: DeviceType;
  /** Self-reported average puffs per day before quitting. */
  puffsPerDay: number;
  /** Pods or devices bought per week before quitting. */
  unitsPerWeek: number;
  /** Price paid per pod or device, in USD. */
  costPerUnit: number;
  /** ISO timestamp of the quit moment. Resetting a quit date updates this. */
  quitDate: string;
  /** Reasons selected/typed during onboarding. */
  reasons: string[];
  /** ISO timestamp of when the plan was first created. */
  createdAt: string;

  // Vape-native details (optional; older plans simply lack them).
  /** Nicotine strength of the liquid/disposable used, in mg/mL. */
  nicotineMg?: number;
  /** Puffs per pod or disposable, if the user knows it. */
  puffsPerDevice?: number;
  /** Liquid size of one pod/disposable/bottle, in mL. */
  deviceSizeMl?: number;
  /**
   * Flavour the user mostly used, e.g. "Mint". Legacy single-flavour
   * field from before the flavour library; superseded by `flavours`.
   * Readers should use planFlavours(), which handles both shapes.
   */
  flavour?: string;
  /** Flavours the user used, picked from the library or typed. */
  flavours?: string[];

  /** Quit approach. Undefined on plans created before taper existed = 'now'. */
  approach?: QuitApproach;
  /** Present only when approach is 'taper'. */
  taper?: TaperConfig;
  /** True once a taper has flipped into a full quit. Never un-set. */
  taperCompleted?: boolean;
}

export type CravingOutcome = 'resisted' | 'slipped';

export interface CravingEvent {
  id: string;
  /** ISO timestamp of when the craving session ended. */
  timestamp: string;
  outcome: CravingOutcome;
  /** How long the urge-surfing session ran, in seconds. */
  durationSec: number;
  /** The trigger the user tagged for this craving, if any (v1.3). */
  trigger?: string;
  /** Urge-surf wave tool: self-rated intensity (1-10) before the wave. */
  intensityBefore?: number;
  /** Urge-surf wave tool: self-rated intensity (1-10) after the wave. */
  intensityAfter?: number;
}

/**
 * An implementation intention: "If [trigger], then I will [action]."
 * Built in onboarding (up to 3), surfaced inside SOS.
 */
export interface CravingPlan {
  id: string;
  /** The situation that sets the craving off, e.g. "After meals". */
  trigger: string;
  /** The small, specific response the user pre-chose, e.g. "Chew gum". */
  action: string;
}

/** One day's mission outcome. `date` is a local yyyy-mm-dd key. */
export interface MissionRecord {
  date: string;
  missionId: string;
  status: 'done' | 'skipped';
}

/** Sub-toggles for the v1.3 engagement notifications. */
export interface NotificationPrefs {
  /** Heads-up 30 min before the user's known peak craving hour. */
  dangerWindow: boolean;
  /** Morning reminder of today's mission, at the chosen time. */
  missionReminder: boolean;
  missionReminderHour: number;
  missionReminderMinute: number;
  /** Friday-evening prompt with the week's kept amount. */
  savingsSweep: boolean;
}

/** One logged puff while cutting down in taper mode. */
export interface PuffEvent {
  id: string;
  timestamp: string;
}

export interface SavingsGoal {
  /** What the user is saving toward, e.g. "New headphones". */
  name: string;
  /** Target price in USD. */
  price: number;
}

export type JournalKind =
  | 'note'
  | 'resisted'
  | 'slip'
  | 'reset'
  | 'intention'
  | 'reflection';

export interface JournalEntry {
  id: string;
  timestamp: string;
  text: string;
  kind: JournalKind;
}
