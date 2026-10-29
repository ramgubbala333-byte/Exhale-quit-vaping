import type { CravingPlan } from '../types';

/**
 * If-then craving plans (implementation intentions). The evidence base
 * (Gollwitzer & Sheeran's meta-analysis) favours a few plans that are
 * specific: a concrete cue and a small, concrete response. The app caps
 * plans at three so they stay sharp instead of diluting.
 */

export const MAX_CRAVING_PLANS = 3;

export const TRIGGERS: string[] = [
  'After meals',
  'With coffee',
  'Driving',
  'Stress',
  'Boredom',
  'Seeing others vape',
  'Waking up',
  'Drinking',
];

/** Ready-made responses; the user can always write their own. */
export const SUGGESTED_ACTIONS: string[] = [
  'Chew gum',
  'Walk for 5 minutes',
  'Open SOS and ride the wave',
  'Text my person',
  'Brush my teeth',
  'Drink a glass of cold water',
  'Step outside for fresh air',
  'Put on a song I love',
];

/** The plan written for a given trigger, if the user has one. */
export function planForTrigger(
  plans: CravingPlan[],
  trigger: string | null | undefined,
): CravingPlan | null {
  if (!trigger) return null;
  return plans.find((p) => p.trigger === trigger) ?? null;
}
