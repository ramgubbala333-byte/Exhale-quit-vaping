/** Shared data model for Exhale. Everything is stored on-device only. */

export type DeviceType = 'disposable' | 'pod' | 'refillable';

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
}

export type CravingOutcome = 'resisted' | 'slipped';

export interface CravingEvent {
  id: string;
  /** ISO timestamp of when the craving session ended. */
  timestamp: string;
  outcome: CravingOutcome;
  /** How long the urge-surfing session ran, in seconds. */
  durationSec: number;
}

export type JournalKind = 'note' | 'resisted' | 'slip' | 'reset';

export interface JournalEntry {
  id: string;
  timestamp: string;
  text: string;
  kind: JournalKind;
}
