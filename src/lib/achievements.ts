/**
 * Achievement badges. Every check is computed from real stored data
 * (elapsed time, craving log, savings math) so badges can never be
 * earned without the underlying behaviour happening.
 */
export interface AchievementContext {
  elapsedSeconds: number;
  resistedCount: number;
  moneySaved: number;
  unitsAvoided: number;
  puffsAvoided: number;
  /** Banked + current: totals across every attempt. Never decreases. */
  lifetimePuffsAvoided: number;
  /** 0..100 progress toward the savings goal, or null when no goal is set. */
  savingsGoalPercent: number | null;
  /** True once a cut-down plan has flipped into a full quit. */
  taperCompleted: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** Short typographic glyph used instead of an icon image. */
  mark: string;
  earned: (ctx: AchievementContext) => boolean;
}

const HOUR = 3600;
const DAY = 86400;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-hour',
    title: 'First Hour',
    description: 'One full hour nicotine-free.',
    mark: '1h',
    earned: (c) => c.elapsedSeconds >= HOUR,
  },
  {
    id: 'first-day',
    title: 'First Day',
    description: '24 hours nicotine-free.',
    mark: '1d',
    earned: (c) => c.elapsedSeconds >= DAY,
  },
  {
    id: 'three-days',
    title: 'Past the Peak',
    description: '72 hours in, where cravings usually peak.',
    mark: '3d',
    earned: (c) => c.elapsedSeconds >= 3 * DAY,
  },
  {
    id: 'first-week',
    title: 'First Week',
    description: 'Seven days nicotine-free.',
    mark: '7d',
    earned: (c) => c.elapsedSeconds >= 7 * DAY,
  },
  {
    id: 'first-month',
    title: 'First Month',
    description: 'Thirty days nicotine-free.',
    mark: '30d',
    earned: (c) => c.elapsedSeconds >= 30 * DAY,
  },
  {
    id: 'first-resist',
    title: 'First Stand',
    description: 'Rode out your first craving.',
    mark: 'R1',
    earned: (c) => c.resistedCount >= 1,
  },
  {
    id: 'ten-resisted',
    title: 'Ten Resisted',
    description: 'Ten cravings faced down.',
    mark: 'R10',
    earned: (c) => c.resistedCount >= 10,
  },
  {
    id: 'twentyfive-resisted',
    title: 'Twenty-Five Resisted',
    description: 'Twenty-five cravings faced down.',
    mark: 'R25',
    earned: (c) => c.resistedCount >= 25,
  },
  {
    id: 'fifty-resisted',
    title: 'Fifty Resisted',
    description: 'Fifty cravings faced down.',
    mark: 'R50',
    earned: (c) => c.resistedCount >= 50,
  },
  {
    id: 'fifty-saved',
    title: '$50 Kept',
    description: 'Fifty dollars not spent on pods or devices.',
    mark: '$50',
    earned: (c) => c.moneySaved >= 50,
  },
  {
    id: 'hundred-saved',
    title: '$100 Kept',
    description: 'One hundred dollars not spent on pods or devices.',
    mark: '$100',
    earned: (c) => c.moneySaved >= 100,
  },
  {
    id: 'goal-quarter',
    title: 'Goal: Quarter Way',
    description: 'A quarter of your savings goal is covered by money kept.',
    mark: 'G25',
    earned: (c) => c.savingsGoalPercent !== null && c.savingsGoalPercent >= 25,
  },
  {
    id: 'goal-half',
    title: 'Goal: Half Way',
    description: 'Half of your savings goal is covered by money kept.',
    mark: 'G50',
    earned: (c) => c.savingsGoalPercent !== null && c.savingsGoalPercent >= 50,
  },
  {
    id: 'goal-full',
    title: 'Goal: Fully Funded',
    description: 'Your savings goal is entirely paid for by money kept.',
    mark: 'G100',
    earned: (c) => c.savingsGoalPercent !== null && c.savingsGoalPercent >= 100,
  },
  {
    id: 'taper-done',
    title: 'Cut-Down Complete',
    description: 'Finished the taper and started the full quit.',
    mark: 'T',
    earned: (c) => c.taperCompleted,
  },
  {
    id: 'ten-units',
    title: 'Ten Not Bought',
    description: 'Ten pods or devices never purchased.',
    mark: 'x10',
    earned: (c) => c.unitsAvoided >= 10,
  },
  {
    id: 'thousand-puffs',
    title: '1,000 Puffs Skipped',
    description: 'One thousand puffs that never happened.',
    mark: '1k',
    earned: (c) => c.puffsAvoided >= 1000,
  },
  {
    id: 'lifetime-5k-puffs',
    title: '5,000 Lifetime Puffs Skipped',
    description: 'Across every attempt, five thousand puffs never happened.',
    mark: '5k',
    earned: (c) => c.lifetimePuffsAvoided >= 5000,
  },
  {
    id: 'lifetime-10k-puffs',
    title: '10,000 Lifetime Puffs Skipped',
    description: 'Across every attempt, ten thousand puffs never happened.',
    mark: '10k',
    earned: (c) => c.lifetimePuffsAvoided >= 10000,
  },
  {
    id: 'lifetime-25k-puffs',
    title: '25,000 Lifetime Puffs Skipped',
    description: 'Across every attempt, twenty-five thousand puffs never happened.',
    mark: '25k',
    earned: (c) => c.lifetimePuffsAvoided >= 25000,
  },
];
